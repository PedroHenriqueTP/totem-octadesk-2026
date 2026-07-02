import fs from 'fs';
import path from 'path';
import { obterEtapaRecomendada, verificarAlertaComercial } from '../src/utils/bifurcation';
import { ETAPAS_PAREDE } from '../src/shared/config/quiz-journey';

// Configuração do Teste
const TOTAL_REQUESTS = 10000;
const OUTPUT_FILE = path.join(__dirname, '..', 'leads_stress_test_backup.csv');

// Listas auxiliares para geração de dados aleatórios e válidos
const NOMES_EXEMPLO = [
  'Reinaldo Alves', 'Carlos Silva', 'Ana Souza', 'Mariana Oliveira', 'Juliana Santos',
  'Felipe Costa', 'Bruno Lima', 'Rafael Martins', 'Amanda Rocha', 'Beatriz Ferreira',
  'Thiago Gomes', 'Lucas Carvalho', 'Gabriela Barbosa', 'Fernanda Ribeiro', 'Rodrigo Almeida'
];

const EMPRESAS_EXEMPLO = [
  'Lojas Americanas', 'Magazine Luiza', 'Mercado Livre', 'Netshoes', 'Dafiti',
  'Centauro', 'Casas Bahia', 'Ponto Frio', 'Kabum', 'Submarino', 'Shoptime',
  'B2W Digital', 'Via Varejo', 'Marisa', 'Renner', 'C&A', 'Riachuelo'
];

const CARGOS_EXEMPLO = [
  'CEO', 'Diretor de E-commerce', 'Gerente de Atendimento', 'Dono', 'Analista de Vendas',
  'Coordenador Comercial', 'Operador de Chat', 'Head de Customer Experience', 'Sócio-proprietário',
  'Gerente Geral', 'Supervisor de Vendas', 'Estagiário', 'Comprador'
];

const DORES_EXEMPLO = ['captacao', 'vendas', 'notificacoes', 'posvenda', 'helpdesk'];
const EQUIPES_EXEMPLO = ['Menos de 50', 'Entre 50 e 200', 'Entre 200 a 500', 'Mais de 500'];
const VOLUMES_EXEMPLO = ['Menos de 50', 'Entre 50 e 200', 'Mais de 200', 'Não sei / não acompanho esse número'];
const PLATAFORMAS_EXEMPLO = [
  'Shopify', 
  'Tray, VTEX, Nuvemshop ou outra plataforma com site próprio', 
  'Principalmente marketplaces (ML, Shopee, Magalu)', 
  'Ainda não tenho loja online'
];

// Helper para mascarar telefone
function gerarTelefoneMascarado(): string {
  const ddd = Math.floor(Math.random() * 89) + 11; // 11 a 99
  const parte1 = Math.floor(Math.random() * 8999) + 1000;
  const parte2 = Math.floor(Math.random() * 8999) + 1000;
  return `(${ddd}) 9${parte1}-${parte2}`;
}

// Interfaces de simulação
interface MockLeadPayload {
  id: number;
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  cargo: string;
  dorP1: string;
  equipeP2: string;
  volumeP3: string;
  plataformaP4: string;
  criado_em: string;
}

interface ProcessedLeadResult {
  payload: MockLeadPayload;
  etapaRecomendada: number;
  etapaNome: string;
  isDecisor: boolean;
  tempoProcessamentoMs: number;
}

async function runStressTest() {
  console.log('============================================================');
  console.log('      INICIANDO TESTE DE ESTRESSE EM LARGA ESCALA           ');
  console.log(`      SIMULANDO ${TOTAL_REQUESTS.toLocaleString()} LEADS SIMULTÂNEOS             `);
  console.log('============================================================\n');

  // Força uma coleta de lixo inicial se o Node foi iniciado com --expose-gc
  if (global.gc) {
    global.gc();
  }

  // Medição de memória antes do processamento
  const memoriaInicial = process.memoryUsage();
  const tempoInicioTotal = performance.now();

  console.log(`[1/4] Gerando ${TOTAL_REQUESTS.toLocaleString()} payloads de dados fictícios...`);
  
  const payloads: MockLeadPayload[] = [];
  for (let i = 1; i <= TOTAL_REQUESTS; i++) {
    const nome = NOMES_EXEMPLO[Math.floor(Math.random() * NOMES_EXEMPLO.length)] + ` (${i})`;
    const empresa = EMPRESAS_EXEMPLO[Math.floor(Math.random() * EMPRESAS_EXEMPLO.length)] + ` Branch ${i}`;
    const telefone = gerarTelefoneMascarado();
    const cleanPhone = telefone.replace(/\D/g, "");
    
    payloads.push({
      id: i,
      nome,
      empresa,
      email: `${cleanPhone}@octadeskevent.com.br`,
      telefone,
      cargo: CARGOS_EXEMPLO[Math.floor(Math.random() * CARGOS_EXEMPLO.length)],
      dorP1: DORES_EXEMPLO[Math.floor(Math.random() * DORES_EXEMPLO.length)],
      equipeP2: EQUIPES_EXEMPLO[Math.floor(Math.random() * EQUIPES_EXEMPLO.length)],
      volumeP3: VOLUMES_EXEMPLO[Math.floor(Math.random() * VOLUMES_EXEMPLO.length)],
      plataformaP4: PLATAFORMAS_EXEMPLO[Math.floor(Math.random() * PLATAFORMAS_EXEMPLO.length)],
      criado_em: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString() // último dia
    });
  }

  console.log(`[2/4] Processando e qualificando concorrência do pipeline...`);

  let erros = 0;
  const resultados: ProcessedLeadResult[] = [];

  // Simulando requisições concorrentes disparando promessas paralelas
  const promessasProcessamento = payloads.map(async (payload) => {
    const startReq = performance.now();

    // 1. Algoritmo de Veredito na Parede
    const recomendacao = obterEtapaRecomendada(payload.dorP1, payload.volumeP3, payload.plataformaP4);
    
    // 2. Lógica Comercial de Priorização de Tomadores de Decisão
    const isDecisor = verificarAlertaComercial(payload.cargo, payload.equipeP2, payload.volumeP3, payload.plataformaP4);

    const endReq = performance.now();

    // Validações de Integridade da Regra de Negócio
    let validacaoValida = true;
    if (payload.plataformaP4 === 'Ainda não tenho loja online' && recomendacao.numero !== 1) {
      validacaoValida = false;
    } else if (payload.plataformaP4 !== 'Ainda não tenho loja online' && payload.volumeP3 === 'Não sei / não acompanho esse número' && recomendacao.numero !== 5) {
      validacaoValida = false;
    } else if (payload.plataformaP4 !== 'Ainda não tenho loja online' && payload.volumeP3 !== 'Não sei / não acompanho esse número') {
      const mapeado = ETAPAS_PAREDE[payload.dorP1];
      if (mapeado && recomendacao.nome !== mapeado.nome) {
        validacaoValida = false;
      }
    }

    if (!validacaoValida) {
      erros++;
    }

    return {
      payload,
      etapaRecomendada: recomendacao.numero,
      etapaNome: recomendacao.nome,
      isDecisor,
      tempoProcessamentoMs: endReq - startReq
    };
  });

  // Aguarda todo o lote concorrente terminar (Simulação de 10.000 requisições simultâneas)
  const processados = await Promise.all(promessasProcessamento);
  resultados.push(...processados);

  const tempoFimTotal = performance.now();
  const tempoTotalMs = tempoFimTotal - tempoInicioTotal;

  // Medição de memória após processamento
  if (global.gc) {
    global.gc();
  }
  const memoriaFinal = process.memoryUsage();

  console.log(`[3/4] Gerando arquivo Excel (.csv) com ${resultados.length.toLocaleString()} linhas...`);

  // Gera o CSV no mesmo layout e formatação do Admin Panel (Semicolon + UTF-8 BOM)
  const headers = [
    "ID",
    "Nome",
    "Empresa",
    "Email",
    "WhatsApp/Contato",
    "Cargo",
    "Dor Principal (P1)",
    "Tamanho da Equipe (P2)",
    "Volume Mensal (P3)",
    "Plataforma (P4)",
    "Etapa Recomendada",
    "MQL Quente/Decisor",
    "Sincronizado HubSpot",
    "Data de Cadastro"
  ];

  const rows = resultados.map((r) => {
    const l = r.payload;
    const etapaIndicada = `Etapa ${r.etapaRecomendada}: ${r.etapaNome}`;
    
    return [
      l.id,
      l.nome,
      l.empresa,
      l.email,
      l.telefone,
      l.cargo,
      ETAPAS_PAREDE[l.dorP1]?.dor || l.dorP1,
      l.equipeP2,
      l.volumeP3,
      l.plataformaP4,
      etapaIndicada,
      r.isDecisor ? "Sim" : "Não",
      "Não", // Offline por padrão antes de sincronizar
      l.criado_em
    ]
      .map((val) => `"${String(val).replace(/"/g, '""')}"`)
      .join(";");
  });

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
  fs.writeFileSync(OUTPUT_FILE, csvContent, 'utf-8');

  console.log(`[4/4] Validando integridade do arquivo gerado...`);
  const fileStats = fs.statSync(OUTPUT_FILE);
  const fileLines = fs.readFileSync(OUTPUT_FILE, 'utf-8').split('\n').length;

  console.log('\n============================================================');
  console.log('                 RELATÓRIO DE RESULTADOS                     ');
  console.log('============================================================');
  console.log(`Total de Leads Processados : ${resultados.length.toLocaleString()}`);
  console.log(`Tempo Total do Pipeline    : ${tempoTotalMs.toFixed(2)} ms (${(tempoTotalMs / 1000).toFixed(3)}s)`);
  console.log(`Vazão de Requisições       : ${Math.round(TOTAL_REQUESTS / (tempoTotalMs / 1000))} req/s`);
  console.log(`Latência Média por Lead    : ${(tempoTotalMs / TOTAL_REQUESTS).toFixed(4)} ms`);
  console.log(`Taxa de Erro nas Regras    : ${((erros / TOTAL_REQUESTS) * 100).toFixed(2)}% (${erros} erros)`);
  console.log(`Tamanho do Arquivo CSV     : ${(fileStats.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Linhas no Backup CSV       : ${fileLines.toLocaleString()} (esperado: ${(TOTAL_REQUESTS + 1).toLocaleString()})`);
  console.log(`Diferença de Memória (Heap): ${((memoriaFinal.heapUsed - memoriaInicial.heapUsed) / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Caminho do Backup Excel    : ${OUTPUT_FILE}`);
  console.log('============================================================\n');

  if (erros === 0 && fileLines === TOTAL_REQUESTS + 1) {
    console.log('✓ TESTE DE ESTRESSE CONCLUÍDO COM 100% DE SUCESSO!');
    process.exit(0);
  } else {
    console.error('✗ TESTE DE ESTRESSE FALHOU NA VERIFICAÇÃO DE DADOS!');
    process.exit(1);
  }
}

runStressTest().catch((err) => {
  console.error('Erro de execução no script:', err);
  process.exit(1);
});
