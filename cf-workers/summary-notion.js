const DATA_SOURCE_ID = "1c94d581-9193-80b0-a413-000b4116ff54";

async function getAllTasks(notionToken) {
  const pages = [];
  let startCursor;

  do {
    const response = await fetch(
      `https://api.notion.com/v1/data_sources/${DATA_SOURCE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Content-Type": "application/json",
          "Notion-Version": "2025-09-03",
        },
        body: JSON.stringify({
          page_size: 100,
          ...(startCursor ? { start_cursor: startCursor } : {}),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Notion API error ${response.status}: ${await response.text()}`
      );
    }

    const result = await response.json();
    pages.push(...result.results);
    startCursor = result.has_more ? result.next_cursor : undefined;
  } while (startCursor);

  return pages;
}

function getTitle(page) {
  return page.properties.Name?.title
    ?.map((item) => item.plain_text)
    .join("")
    .trim() || "Sin nombre";
}

function getStatus(page) {
  return page.properties.Estado?.status?.name || "Sin estado";
}

function getPriority(page) {
  return page.properties.Prioridad?.select?.name || "";
}

function getDateText(page) {
  const date = page.properties["Fecha de inicio/entrega"]?.date;

  if (!date?.start) return "";

  const start = date.start.slice(0, 10);
  const end = date.end?.slice(0, 10);

  if (end && end !== start) {
    return `del ${formatDate(start)} al ${formatDate(end)}`;
  }

  return `entrega ${formatDate(start)}`;
}

function formatDate(value) {
  const [year, month, day] = value.split("-");

  const months = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  return `${Number(day)} de ${months[Number(month) - 1]}`;
}

function taskLine(page) {
  const title = getTitle(page);
  const priority = getPriority(page);
  const date = getDateText(page);

  return `- ${title}${priority ? ` — ${priority}` : ""}${date ? `, ${date}` : ""}`;
}

function buildSummary(pages) {
  const groups = {
    "En curso": [],
    Bloqueado: [],
    "Sin empezar": [],
    Hecho: [],
  };

  for (const page of pages) {
    const status = getStatus(page);

    if (!groups[status]) {
      groups[status] = [];
    }

    groups[status].push(page);
  }

  for (const status of Object.keys(groups)) {
    groups[status].sort((a, b) => {
      const priorityA = getPriority(a) || "P9";
      const priorityB = getPriority(b) || "P9";
      return priorityA.localeCompare(priorityB);
    });
  }

  const sections = ["Resumen de tareas", ""];

  if (groups["Sin empezar"].length) {
    sections.push("⚪ Pendientes");
    sections.push(...groups["Sin empezar"].map(taskLine));
    sections.push("");
  }

  if (groups["En curso"].length) {
    sections.push("🟡 En curso");
    sections.push(...groups["En curso"].map(taskLine));
    sections.push("");
  }

  sections.push("⛔ Bloqueadas");

  if (groups.Bloqueado?.length) {
    sections.push(...groups.Bloqueado.map(taskLine));
  } else {
    sections.push("- Ninguna");
  }

  sections.push("");

  return sections.join("\n").trim() + "\n" + "Con cariño _Juan Botsé_";
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "GET" },
      });
    }

    if (!env.NOTION_TOKEN) {
      return new Response("Falta el secreto NOTION_TOKEN", { status: 500 });
    }

    try {
      const pages = await getAllTasks(env.NOTION_TOKEN);
      const activePages = pages.filter((page) => getStatus(page) !== "Hecho");
      const summary = buildSummary(activePages);

      return new Response(summary, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    } catch (error) {
      console.error(error);
      return new Response("No se pudo generar el resumen", { status: 502 });
    }
  },
};