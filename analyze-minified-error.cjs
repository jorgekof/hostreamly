/**
 * Script para analizar errores en código minificado usando source maps
 * Específicamente diseñado para identificar el error 'eT.initialize' en línea 33:3756
 */

const fs = require('fs');
const path = require('path');

// Función para analizar el error específico
function analyzeMinifiedError() {
  console.log('🔍 Analizando error minificado: eT.initialize en línea 33:3756');
  
  // Buscar archivos de source map en el directorio dist
  const distDir = path.join(__dirname, 'dist', 'assets');
  
  if (!fs.existsSync(distDir)) {
    console.error('❌ Directorio dist/assets no encontrado');
    return;
  }
  
  const files = fs.readdirSync(distDir);
  const jsFiles = files.filter(file => file.endsWith('.js'));
  const mapFiles = files.filter(file => file.endsWith('.js.map'));
  
  console.log('📁 Archivos JS encontrados:', jsFiles);
  console.log('🗺️ Archivos de source map encontrados:', mapFiles);
  
  // Analizar cada archivo JS para encontrar el que contiene 'eT.initialize'
  jsFiles.forEach(jsFile => {
    const jsPath = path.join(distDir, jsFile);
    const content = fs.readFileSync(jsPath, 'utf8');
    
    // Buscar patrones que podrían corresponder a 'eT.initialize'
    const patterns = [
      /eT\.initialize/g,
      /[a-zA-Z]{1,2}\.initialize/g,
      /initialize/g
    ];
    
    patterns.forEach((pattern, index) => {
      const matches = [...content.matchAll(pattern)];
      if (matches.length > 0) {
        console.log(`\n🎯 Archivo: ${jsFile}`);
        console.log(`📍 Patrón ${index + 1} encontrado ${matches.length} veces:`);
        
        matches.forEach((match, matchIndex) => {
          const position = match.index;
          const line = content.substring(0, position).split('\n').length;
          const column = position - content.lastIndexOf('\n', position - 1) - 1;
          
          console.log(`   Match ${matchIndex + 1}: Línea ${line}, Columna ${column}`);
          console.log(`   Contexto: ${content.substring(Math.max(0, position - 50), position + 50)}`);
        });
      }
    });
  });
  
  // Intentar usar source maps si están disponibles
  if (mapFiles.length > 0) {
    console.log('\n🗺️ Intentando usar source maps...');
    
    try {
      const sourceMap = require('source-map');
      
      mapFiles.forEach(mapFile => {
        const mapPath = path.join(distDir, mapFile);
        const mapContent = fs.readFileSync(mapPath, 'utf8');
        
        console.log(`\n📋 Analizando source map: ${mapFile}`);
        
        try {
          const consumer = new sourceMap.SourceMapConsumer(mapContent);
          
          // Analizar la posición específica del error (línea 33, columna 3756)
          const originalPosition = consumer.originalPositionFor({
            line: 33,
            column: 3756
          });
          
          if (originalPosition.source) {
            console.log('✅ Posición original encontrada:');
            console.log(`   Archivo: ${originalPosition.source}`);
            console.log(`   Línea: ${originalPosition.line}`);
            console.log(`   Columna: ${originalPosition.column}`);
            console.log(`   Nombre: ${originalPosition.name || 'N/A'}`);
          } else {
            console.log('❌ No se pudo mapear la posición específica');
          }
          
          consumer.destroy();
        } catch (error) {
          console.error(`❌ Error procesando source map ${mapFile}:`, error.message);
        }
      });
    } catch (error) {
      console.log('⚠️ Módulo source-map no disponible. Instalando...');
      console.log('Ejecuta: npm install source-map');
    }
  }
  
  // Análisis adicional de librerías sospechosas
  console.log('\n🔍 Analizando librerías sospechosas en el bundle...');
  
  const suspiciousPatterns = [
    { name: 'React', pattern: /react/gi },
    { name: 'Radix UI', pattern: /radix/gi },
    { name: 'Framer Motion', pattern: /framer/gi },
    { name: 'Emotion', pattern: /emotion/gi },
    { name: 'Styled Components', pattern: /styled/gi },
    { name: 'CSS-in-JS', pattern: /cssinjs|css-in-js/gi },
    { name: 'Polyfill', pattern: /polyfill/gi }
  ];
  
  jsFiles.forEach(jsFile => {
    const jsPath = path.join(distDir, jsFile);
    const content = fs.readFileSync(jsPath, 'utf8');
    
    console.log(`\n📦 Analizando ${jsFile}:`);
    
    suspiciousPatterns.forEach(lib => {
      const matches = content.match(lib.pattern);
      if (matches) {
        console.log(`   ${lib.name}: ${matches.length} referencias encontradas`);
      }
    });
  });
}

// Función para generar reporte detallado
function generateDetailedReport() {
  console.log('\n📊 REPORTE DETALLADO DEL ERROR');
  console.log('================================');
  
  const report = {
    timestamp: new Date().toISOString(),
    error: {
      message: "Cannot read properties of undefined (reading 'setProperty')",
      location: "eT.initialize (<anonymous>:33:3756)",
      type: "TypeError"
    },
    analysis: {
      suspectedCause: "Librería de terceros intentando acceder a propiedades CSS",
      likelyCandidates: [
        "Radix UI (componentes de UI)",
        "Framer Motion (animaciones)",
        "Emotion/Styled Components (CSS-in-JS)",
        "React (efectos de hidratación)"
      ]
    },
    recommendations: [
      "Verificar source maps para identificación exacta",
      "Implementar polyfill más específico para la librería identificada",
      "Considerar actualizar dependencias problemáticas",
      "Implementar lazy loading para componentes problemáticos"
    ]
  };
  
  console.log(JSON.stringify(report, null, 2));
  
  // Guardar reporte en archivo
  fs.writeFileSync(
    path.join(__dirname, 'error-analysis-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n💾 Reporte guardado en: error-analysis-report.json');
}

// Ejecutar análisis
if (require.main === module) {
  console.log('🚀 Iniciando análisis de error minificado...');
  analyzeMinifiedError();
  generateDetailedReport();
  console.log('\n✅ Análisis completado.');
}

module.exports = {
  analyzeMinifiedError,
  generateDetailedReport
};