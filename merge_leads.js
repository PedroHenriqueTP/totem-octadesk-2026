const fs = require('fs');
const path = require('path');

const directoryPath = './'; // Diretório onde os arquivos JSON estão

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        return console.log('Não foi possível ler o diretório: ' + err);
    } 
    
    let allLeads = [];
    
    files.forEach((file) => {
        // Filtra arquivos que começam com 'leads_totem_' e terminam com '.json'
        if (file.startsWith('leads_totem_') && file.endsWith('.json')) {
            const filePath = path.join(directoryPath, file);
            const content = fs.readFileSync(filePath, 'utf8');
            try {
                const leads = JSON.parse(content);
                allLeads = allLeads.concat(leads);
                console.log(`Mesclados ${leads.length} leads do arquivo ${file}`);
            } catch (e) {
                console.error(`Erro ao processar ${file}:`, e);
            }
        }
    });
    
    // Remove duplicatas baseadas no ID (caso o mesmo arquivo seja processado duas vezes)
    const uniqueLeads = Array.from(new Map(allLeads.map(item => [item.id, item])).values());
    
    // Ordena por timestamp
    uniqueLeads.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputFilename = `base_consolidada_leads_${timestamp}.json`;
    
    fs.writeFileSync(outputFilename, JSON.stringify(uniqueLeads, null, 2));
    console.log(`\nSucesso! ${uniqueLeads.length} leads únicos consolidados em ${outputFilename}`);
});
