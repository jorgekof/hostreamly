import { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

interface TestError {
  test: string;
  error: string;
  screenshot?: string;
  timestamp: string;
}

interface PerformanceMetric {
  test: string;
  metric: string;
  value: number;
  unit: string;
  timestamp: string;
}

interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  errors: TestError[];
  performance: PerformanceMetric[];
  timestamp: string;
}

class HostreamlyTestReporter implements Reporter {
  private config: FullConfig;
  private suite: Suite;
  private errors: TestError[] = [];
  private performance: PerformanceMetric[] = [];
  private startTime: number;

  onBegin(config: FullConfig, suite: Suite) {
    this.config = config;
    this.suite = suite;
    this.startTime = Date.now();
    console.log('🚀 Iniciando tests de Hostreamly...');
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'failed') {
      this.errors.push({
        test: test.title,
        error: result.error?.message || 'Error desconocido',
        screenshot: result.attachments.find(a => a.name === 'screenshot')?.path,
        timestamp: new Date().toISOString()
      });
    }

    // Extraer métricas de rendimiento de los logs
    result.stdout.forEach(output => {
      const lines = output.toString().split('\n');
      lines.forEach(line => {
        // Buscar patrones de métricas
        const timeMatch = line.match(/(\w+):\s*(\d+)ms/);
        if (timeMatch) {
          this.performance.push({
            test: test.title,
            metric: timeMatch[1],
            value: parseInt(timeMatch[2]),
            unit: 'ms',
            timestamp: new Date().toISOString()
          });
        }

        const memoryMatch = line.match(/Memoria\s+(\w+):\s*{[^}]*usedJSHeapSize:\s*(\d+)/);
        if (memoryMatch) {
          this.performance.push({
            test: test.title,
            metric: `memoria_${memoryMatch[1]}`,
            value: parseInt(memoryMatch[2]),
            unit: 'bytes',
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  }

  onEnd(result: FullResult) {
    const duration = Date.now() - this.startTime;
    const summary: TestSummary = {
      totalTests: result.status === 'passed' ? this.suite.allTests().length : 0,
      passed: this.suite.allTests().filter(t => t.results[0]?.status === 'passed').length,
      failed: this.suite.allTests().filter(t => t.results[0]?.status === 'failed').length,
      skipped: this.suite.allTests().filter(t => t.results[0]?.status === 'skipped').length,
      duration,
      errors: this.errors,
      performance: this.performance,
      timestamp: new Date().toISOString()
    };

    this.generateHTMLReport(summary);
    this.generateJSONReport(summary);
    this.generateConsoleReport(summary);
  }

  private generateHTMLReport(summary: TestSummary) {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Tests - Hostreamly</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
        }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .duration { color: #17a2b8; }
        .section {
            padding: 30px;
        }
        .section h2 {
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .error-item {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .error-title {
            font-weight: bold;
            color: #721c24;
            margin-bottom: 5px;
        }
        .error-message {
            color: #721c24;
            font-family: monospace;
            font-size: 0.9em;
        }
        .performance-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .performance-card {
            background: #e3f2fd;
            border: 1px solid #bbdefb;
            border-radius: 4px;
            padding: 15px;
        }
        .performance-test {
            font-weight: bold;
            color: #1565c0;
            margin-bottom: 10px;
        }
        .performance-metrics {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 10px;
            font-size: 0.9em;
        }
        .metric-name {
            color: #333;
        }
        .metric-value {
            font-weight: bold;
            color: #1976d2;
        }
        .timestamp {
            color: #666;
            font-size: 0.8em;
            text-align: center;
            padding: 20px;
            border-top: 1px solid #eee;
        }
        .no-data {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 40px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎬 Hostreamly Test Report</h1>
            <p>Reporte automático de pruebas de calidad</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${summary.totalTests}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number passed">${summary.passed}</div>
                <div class="stat-label">Pasaron</div>
            </div>
            <div class="stat-card">
                <div class="stat-number failed">${summary.failed}</div>
                <div class="stat-label">Fallaron</div>
            </div>
            <div class="stat-card">
                <div class="stat-number skipped">${summary.skipped}</div>
                <div class="stat-label">Omitidos</div>
            </div>
            <div class="stat-card">
                <div class="stat-number duration">${Math.round(summary.duration / 1000)}s</div>
                <div class="stat-label">Duración</div>
            </div>
        </div>

        ${summary.errors.length > 0 ? `
        <div class="section">
            <h2>❌ Errores Encontrados</h2>
            ${summary.errors.map(error => `
            <div class="error-item">
                <div class="error-title">${error.test}</div>
                <div class="error-message">${error.error}</div>
                ${error.screenshot ? `<div style="margin-top: 10px;"><a href="${error.screenshot}" target="_blank">Ver Screenshot</a></div>` : ''}
            </div>
            `).join('')}
        </div>
        ` : ''}

        ${summary.performance.length > 0 ? `
        <div class="section">
            <h2>📊 Métricas de Rendimiento</h2>
            <div class="performance-grid">
                ${this.groupPerformanceByTest(summary.performance).map(group => `
                <div class="performance-card">
                    <div class="performance-test">${group.test}</div>
                    <div class="performance-metrics">
                        ${group.metrics.map(metric => `
                        <div class="metric-name">${metric.metric}:</div>
                        <div class="metric-value">${metric.value} ${metric.unit}</div>
                        `).join('')}
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
        ` : `
        <div class="section">
            <div class="no-data">No se recopilaron métricas de rendimiento</div>
        </div>
        `}

        <div class="timestamp">
            Generado el ${new Date(summary.timestamp).toLocaleString('es-ES')}
        </div>
    </div>
</body>
</html>
    `;

    const reportPath = path.join(process.cwd(), 'test-results', 'hostreamly-report.html');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, html);
    console.log(`📊 Reporte HTML generado: ${reportPath}`);
  }

  private generateJSONReport(summary: TestSummary) {
    const reportPath = path.join(process.cwd(), 'test-results', 'hostreamly-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
    console.log(`📄 Reporte JSON generado: ${reportPath}`);
  }

  private generateConsoleReport(summary: TestSummary) {
    console.log('\n' + '='.repeat(60));
    console.log('🎬 HOSTREAMLY - REPORTE DE TESTS');
    console.log('='.repeat(60));
    console.log(`📊 Total de tests: ${summary.totalTests}`);
    console.log(`✅ Pasaron: ${summary.passed}`);
    console.log(`❌ Fallaron: ${summary.failed}`);
    console.log(`⏭️  Omitidos: ${summary.skipped}`);
    console.log(`⏱️  Duración: ${Math.round(summary.duration / 1000)}s`);
    
    if (summary.errors.length > 0) {
      console.log('\n❌ ERRORES ENCONTRADOS:');
      summary.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.test}`);
        console.log(`   ${error.error}`);
      });
    }

    if (summary.performance.length > 0) {
      console.log('\n📊 MÉTRICAS DE RENDIMIENTO:');
      const perfGroups = this.groupPerformanceByTest(summary.performance);
      perfGroups.forEach(group => {
        console.log(`\n🎯 ${group.test}:`);
        group.metrics.forEach(metric => {
          console.log(`   ${metric.metric}: ${metric.value} ${metric.unit}`);
        });
      });
    }

    const successRate = summary.totalTests > 0 ? (summary.passed / summary.totalTests * 100).toFixed(1) : '0';
    console.log(`\n🎯 Tasa de éxito: ${successRate}%`);
    console.log('='.repeat(60));
  }

  private groupPerformanceByTest(performance: PerformanceMetric[]) {
    const groups = new Map<string, PerformanceMetric[]>();
    
    performance.forEach(metric => {
      if (!groups.has(metric.test)) {
        groups.set(metric.test, []);
      }
      groups.get(metric.test)!.push(metric);
    });

    return Array.from(groups.entries()).map(([test, metrics]) => ({
      test,
      metrics
    }));
  }
}

export default HostreamlyTestReporter;

// Utilidades adicionales para análisis de tests
export class TestAnalyzer {
  static analyzePerformance(metrics: PerformanceMetric[]) {
    const analysis = {
      slowTests: metrics.filter(m => m.unit === 'ms' && m.value > 5000),
      memoryIntensive: metrics.filter(m => m.unit === 'bytes' && m.value > 50 * 1024 * 1024),
      averageLoadTime: 0,
      recommendations: [] as string[]
    };

    const loadTimes = metrics.filter(m => m.metric.includes('carga') || m.metric.includes('load'));
    if (loadTimes.length > 0) {
      analysis.averageLoadTime = loadTimes.reduce((sum, m) => sum + m.value, 0) / loadTimes.length;
    }

    if (analysis.slowTests.length > 0) {
      analysis.recommendations.push('Optimizar tests lentos (>5s)');
    }

    if (analysis.memoryIntensive.length > 0) {
      analysis.recommendations.push('Revisar uso de memoria (>50MB)');
    }

    if (analysis.averageLoadTime > 3000) {
      analysis.recommendations.push('Mejorar tiempo de carga promedio');
    }

    return analysis;
  }

  static generateHealthScore(summary: TestSummary): number {
    let score = 100;

    // Penalizar por tests fallidos
    if (summary.totalTests > 0) {
      const failureRate = summary.failed / summary.totalTests;
      score -= failureRate * 50;
    }

    // Penalizar por errores críticos
    const criticalErrors = summary.errors.filter(e => 
      e.error.includes('timeout') || 
      e.error.includes('network') ||
      e.error.includes('crash')
    );
    score -= criticalErrors.length * 10;

    // Penalizar por rendimiento pobre
    const slowMetrics = summary.performance.filter(p => 
      p.unit === 'ms' && p.value > 5000
    );
    score -= slowMetrics.length * 5;

    return Math.max(0, Math.round(score));
  }
}