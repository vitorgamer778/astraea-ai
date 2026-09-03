const responses = [
  {
    matches: ["code", "código", "typescript", "react", "next"],
    content: "## Demo de assistência técnica\n\nEm uma versão conectada a um modelo, a Astraea poderia analisar requisitos e produzir implementações como esta:\n\n```ts\ntype Project = {\n  name: string;\n  status: \"active\" | \"archived\";\n};\n\nconst activeProjects = projects.filter(\n  (project) => project.status === \"active\",\n);\n```\n\nEste conteúdo é demonstrativo e foi gerado localmente, sem enviar sua mensagem para uma IA externa.",
  },
  {
    matches: ["plano", "planejar", "roadmap", "project", "projeto"],
    content: "## Plano demonstrativo\n\n1. Definir o objetivo e os critérios de sucesso.\n2. Dividir o trabalho em entregas pequenas.\n3. Validar cada etapa com evidências.\n4. Registrar decisões e próximos passos.\n\n> Esta é uma resposta local de demonstração para apresentar a experiência da Astraea no portfólio.",
  },
  {
    matches: ["resum", "analis", "document", "texto"],
    content: "## Análise demonstrativa\n\nA Astraea organizaria o conteúdo em **contexto**, **pontos principais**, **riscos** e **ações recomendadas**. Nesta versão de portfólio, nenhum documento ou mensagem é enviado a um provedor de IA externo.",
  },
];

export function createDemoResponse(message: string) {
  const normalized = message.toLocaleLowerCase();
  const selected = responses.find(({ matches }) => matches.some((match) => normalized.includes(match)));
  return selected?.content ?? "## Astraea Demo\n\nEsta interface demonstra autenticação, conversas persistentes, Markdown, blocos de código e uma experiência de chat premium.\n\nA integração com modelos de IA está **desativada** nesta versão de portfólio, então sua mensagem não foi enviada a nenhum provedor externo.";
}
