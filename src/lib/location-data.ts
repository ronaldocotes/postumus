// Dados de localização do Brasil - Base atualizada
// Fontes: IBGE, Prefeituras municipais

export interface Estado {
  sigla: string;
  nome: string;
  codigoIBGE: string;
}

export interface Cidade {
  nome?: string;
  codigoIBGE?: string;
  bairros: string[];
}

export const estados: Estado[] = [
  { sigla: "AC", nome: "Acre", codigoIBGE: "12" },
  { sigla: "AL", nome: "Alagoas", codigoIBGE: "27" },
  { sigla: "AP", nome: "Amapá", codigoIBGE: "16" },
  { sigla: "AM", nome: "Amazonas", codigoIBGE: "13" },
  { sigla: "BA", nome: "Bahia", codigoIBGE: "29" },
  { sigla: "CE", nome: "Ceará", codigoIBGE: "23" },
  { sigla: "DF", nome: "Distrito Federal", codigoIBGE: "53" },
  { sigla: "ES", nome: "Espírito Santo", codigoIBGE: "32" },
  { sigla: "GO", nome: "Goiás", codigoIBGE: "52" },
  { sigla: "MA", nome: "Maranhão", codigoIBGE: "21" },
  { sigla: "MT", nome: "Mato Grosso", codigoIBGE: "51" },
  { sigla: "MS", nome: "Mato Grosso do Sul", codigoIBGE: "50" },
  { sigla: "MG", nome: "Minas Gerais", codigoIBGE: "31" },
  { sigla: "PA", nome: "Pará", codigoIBGE: "15" },
  { sigla: "PB", nome: "Paraíba", codigoIBGE: "25" },
  { sigla: "PR", nome: "Paraná", codigoIBGE: "41" },
  { sigla: "PE", nome: "Pernambuco", codigoIBGE: "26" },
  { sigla: "PI", nome: "Piauí", codigoIBGE: "22" },
  { sigla: "RJ", nome: "Rio de Janeiro", codigoIBGE: "33" },
  { sigla: "RN", nome: "Rio Grande do Norte", codigoIBGE: "24" },
  { sigla: "RS", nome: "Rio Grande do Sul", codigoIBGE: "43" },
  { sigla: "RO", nome: "Rondônia", codigoIBGE: "11" },
  { sigla: "RR", nome: "Roraima", codigoIBGE: "14" },
  { sigla: "SC", nome: "Santa Catarina", codigoIBGE: "42" },
  { sigla: "SP", nome: "São Paulo", codigoIBGE: "35" },
  { sigla: "SE", nome: "Sergipe", codigoIBGE: "28" },
  { sigla: "TO", nome: "Tocantins", codigoIBGE: "17" },
];

// Cidades do Amapá (16 municípios - IBGE 2024)
const cidadesAP: Record<string, Cidade> = {
  "Macapá": {
    codigoIBGE: "1600303",
    bairros: [
      "Centro", "Santa Rita", "Perpétuo Socorro", "Marabaixo", "Marabaixo II", "Marabaixo III", 
      "Buritizal", "Laguinho", "Pacoval", "Cidade Nova", "Jardim Equatorial", "Jardim Felicidade",
      "Infraero", "Alvorada", "Trem", "Zerão", "Universidade", "Novo Horizonte", "Beirol",
      "Congós", "Muca", "Julião Ramos", "Rosa Linda", "São Lázaro", "Santa Inês", "Boné Azul",
      "Vila Nova", "Vila Amazonas", "Vila Industrial", "Vila Permanente", "Vila Santa Luzia",
      "Bacuri", "Curiaú", "Fazendinha", "Igarapé da Fortaleza", "Matinha", "Pantanal",
      "São Raimundo", "São Raimundo do Pirativa", "São Raimundo do Fico", "São Raimundo do Matapi",
      "Cidade do Sol", "Jardim Marco Zero", "Loteamento Novo Horizonte", "Morada do Sol",
      "Portal da Amazônia", "Renascer", "Terra Prometida", "Vila Progresso", "Vila Vitória"
    ]
  },
  "Santana": {
    codigoIBGE: "1600600",
    bairros: [
      "Centro", "Novo Horizonte", "Vila do V", "Vila do Bispo", "Vila do Pescador",
      "Vila do Conde", "Vila do Carmo", "Vila do Sol", "Vila do Triunfo", "Vila Militar",
      "Jardim Felicidade", "Jardim América", "Cidade Nova", "Beirol", "Alvorada",
      "São Lázaro", "Santa Inês", "Marabaixo", "Pacoval", "Buritizal"
    ]
  },
  "Mazagão": {
    codigoIBGE: "1600402",
    bairros: ["Centro", "Novo Mazagão", "Vila do Carmo", "Vila do Sol", "São José"]
  },
  "Porto Grande": {
    codigoIBGE: "1600535",
    bairros: ["Centro", "Vila do Carmo", "Vila do Sol", "Novo Horizonte", "São José"]
  },
  "Pedra Branca do Amapari": {
    codigoIBGE: "1600154",
    bairros: ["Centro", "Vila Nova", "Novo Horizonte"]
  },
  "Serra do Navio": {
    codigoIBGE: "1600055",
    bairros: ["Centro", "Vila do Carmo", "Novo Horizonte"]
  },
  "Oiapoque": {
    codigoIBGE: "1600501",
    bairros: ["Centro", "Vila do Carmo", "Novo Horizonte", "São José"]
  },
  "Laranjal do Jari": {
    codigoIBGE: "1600279",
    bairros: ["Centro", "Vila do Carmo", "Novo Horizonte", "Beirol"]
  },
  "Calçoene": {
    codigoIBGE: "1600200",
    bairros: ["Centro", "Vila do Carmo", "Novo Horizonte"]
  },
  "Amapá": {
    codigoIBGE: "1600105",
    bairros: ["Centro", "Vila do Carmo", "Novo Horizonte"]
  },
  "Pracuúba": {
    codigoIBGE: "1600550",
    bairros: ["Centro"]
  },
  "Tartarugalzinho": {
    codigoIBGE: "1600709",
    bairros: ["Centro", "Vila Nova"]
  },
  "Vitória do Jari": {
    codigoIBGE: "1600808",
    bairros: ["Centro", "Vila do Carmo", "Novo Horizonte"]
  },
  "Cutias": {
    codigoIBGE: "1600218",
    bairros: ["Centro"]
  },
  "Ferreira Gomes": {
    codigoIBGE: "1600234",
    bairros: ["Centro", "Vila Nova"]
  },
  "Itaubal": {
    codigoIBGE: "1600259",
    bairros: ["Centro"]
  },
};

// Cidades do Pará (144 municípios - principais apenas)
const cidadesPA: Record<string, Cidade> = {
  "Belém": {
    codigoIBGE: "1501402",
    bairros: [
      "Centro", "Cidade Velha", "Campina", "Nazaré", "Reduto", "Umarizal", "Marco",
      "São Brás", "Pedreira", "Marambaia", "Tenoné", "Coqueiro", "Parque Verde",
      "Barreiro", "Tapanã", "Guamá", "Jurunas", "Condor", "Souza", "Telégrafo",
      "Mangueirão", "Val-de-Cans", "Batista Campos", "Canudos", "Fátima",
      "Miramar", "Natal de Nazaré", "Sacramenta", "São Francisco", "Terra Firme"
    ]
  },
  "Ananindeua": {
    codigoIBGE: "1500800",
    bairros: [
      "Centro", "Cidade Nova", "Coqueiro", "Curuçá", "Guanabara", "Icuí", "Mangueirão",
      "Marituba", "Paar", "Quarenta Horas", "São João do Outeiro", "Vila Nova",
      "Águas Lindas", "Brasília", "Cidade Nova II", "Coqueiro II", "Levilândia"
    ]
  },
  "Marituba": {
    codigoIBGE: "1504422",
    bairros: ["Centro", "Novo Horizonte", "Vila Nova", "Jardim Felicidade"]
  },
  "Benevides": {
    codigoIBGE: "1501501",
    bairros: ["Centro", "Vila Nova", "Novo Horizonte"]
  },
  "Santa Bárbara do Pará": {
    codigoIBGE: "1506351",
    bairros: ["Centro", "Vila Nova"]
  },
  "Castanhal": {
    codigoIBGE: "1502401",
    bairros: ["Centro", "Novo Horizonte", "Vila Nova", "Jardim Felicidade"]
  },
  "Bragança": {
    codigoIBGE: "1501709",
    bairros: ["Centro", "Novo Horizonte", "Vila Nova"]
  },
  "Capanema": {
    codigoIBGE: "1502203",
    bairros: ["Centro", "Vila Nova"]
  },
  "Santarém": {
    codigoIBGE: "1506807",
    bairros: ["Centro", "Novo Horizonte", "Vila Nova", "Jardim Felicidade"]
  },
  "Marabá": {
    codigoIBGE: "1504208",
    bairros: ["Centro", "Novo Horizonte", "Vila Nova"]
  },
};

// Mapeamento completo
export const cidadesPorEstado: Record<string, string[]> = {
  AP: Object.keys(cidadesAP),
  PA: Object.keys(cidadesPA),
};

export const bairrosPorCidade: Record<string, string[]> = {
  ...Object.fromEntries(Object.entries(cidadesAP).map(([k, v]) => [k, v.bairros])),
  ...Object.fromEntries(Object.entries(cidadesPA).map(([k, v]) => [k, v.bairros])),
};

// Estado civil
export const estadosCivis = [
  "Solteiro(a)",
  "Casado(a)",
  "Divorciado(a)",
  "Viúvo(a)",
  "Separado(a)",
  "União Estável"
];

// Funções auxiliares
export function getBairros(cidade: string): string[] {
  return bairrosPorCidade[cidade] || [];
}

export function getCidades(estado: string): string[] {
  return cidadesPorEstado[estado] || [];
}

export function getEstadoBySigla(sigla: string): Estado | undefined {
  return estados.find(e => e.sigla === sigla);
}

// Função para adicionar nova cidade/bairro (para expansão futura)
export function adicionarCidade(estado: string, cidade: string, bairros: string[]): void {
  if (!cidadesPorEstado[estado]) {
    cidadesPorEstado[estado] = [];
  }
  if (!cidadesPorEstado[estado].includes(cidade)) {
    cidadesPorEstado[estado].push(cidade);
  }
  bairrosPorCidade[cidade] = bairros;
}
