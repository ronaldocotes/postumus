// Dados de cidades e bairros do Amapá (Macapá e municípios próximos)
export const estados = [
  { sigla: "AP", nome: "Amapá" },
  { sigla: "PA", nome: "Pará" },
];

export const cidadesPorEstado: Record<string, string[]> = {
  AP: ["Macapá", "Santana", "Mazagão", "Porto Grande", "Pedra Branca do Amapari", "Serra do Navio", "Oiapoque", "Laranjal do Jari", "Calçoene", "Amapá", "Pracuúba", "Tartarugalzinho", "Vitória do Jari", "Cutias", "Ferreira Gomes", "Itaubal", "Jari", "Pedra Branca do Amapari"],
  PA: ["Belém", "Ananindeua", "Marituba", "Benevides", "Santa Bárbara do Pará", "Castanhal", "Bragança", "Capanema"],
};

export const bairrosPorCidade: Record<string, string[]> = {
  "Macapá": [
    "Centro", "Santa Rita", "Perpétuo Socorro", "Marabaixo", "Marabaixo II", "Marabaixo III", 
    "Buritizal", "Laguinho", "Pacoval", "Cidade Nova", "Jardim Equatorial", "Jardim Felicidade",
    "Infraero", "Alvorada", "Trem", "Zerão", "Universidade", "Novo Horizonte", "Beirol",
    "Congós", "Muca", "Julião Ramos", "Rosa Linda", "São Lázaro", "Santa Inês", "Boné Azul",
    "Vila Nova", "Vila Amazonas", "Vila Industrial", "Vila Permanente", "Vila Santa Luzia",
    "Bacuri", "Curiaú", "Fazendinha", "Igarapé da Fortaleza", "Matinha", "Pantanal",
    "São Raimundo", "São Raimundo do Pirativa", "São Raimundo do Fico", "São Raimundo do Matapi"
  ],
  "Santana": [
    "Centro", "Novo Horizonte", "Vila do V", "Vila do Bispo", "Vila do Pescador",
    "Vila do Conde", "Vila do Carmo", "Vila do Gama", "Vila do Sol", "Vila do Triunfo"
  ],
  "Mazagão": ["Centro", "Novo Mazagão", "Vila do Carmo", "Vila do Sol"],
  "Porto Grande": ["Centro", "Vila do Carmo", "Vila do Sol"],
  "Belém": [
    "Centro", "Cidade Velha", "Campina", "Nazaré", "Reduto", "Umarizal", "Marco",
    "São Brás", "Pedreira", "Marambaia", "Tenoné", "Coqueiro", "Parque Verde",
    "Barreiro", "Tapanã", "Guamá", "Jurunas", "Condor", "Souza", "Telégrafo"
  ],
  "Ananindeua": [
    "Centro", "Cidade Nova", "Coqueiro", "Curuçá", "Guanabara", "Icuí", "Mangueirão",
    "Marituba", "Paar", "Quarenta Horas", "São João do Outeiro", "Vila Nova"
  ],
};

export const estadosCivis = [
  "Solteiro(a)",
  "Casado(a)",
  "Divorciado(a)",
  "Viúvo(a)",
  "Separado(a)",
  "União Estável"
];

// Função para obter bairros de uma cidade
export function getBairros(cidade: string): string[] {
  return bairrosPorCidade[cidade] || [];
}

// Função para obter cidades de um estado
export function getCidades(estado: string): string[] {
  return cidadesPorEstado[estado] || [];
}
