# 🔧 Configuración de Credenciales DigitalOcean Spaces

## 📋 Pasos para Configurar

### 1. Abrir el archivo de credenciales
Navega a: `backend/config/digitalocean-credentials.js`

### 2. Reemplazar los valores de ejemplo

```javascript
module.exports = {
  // 🔑 Reemplaza con tus datos reales:
  accessKeyId: 'TU_ACCESS_KEY_ID_AQUI',           // ← Cambia esto
  secretAccessKey: 'TU_SECRET_ACCESS_KEY_AQUI',   // ← Cambia esto
  spaceName: 'TU_SPACE_NAME_AQUI',                // ← Cambia esto
  region: 'TU_REGION_AQUI',                       // ← Cambia esto
};
```

### 3. Ejemplo de configuración completa

```javascript
module.exports = {
  accessKeyId: 'DO00ABC123XYZ789',
  secretAccessKey: 'abcd1234efgh5678ijkl9012mnop3456qrst7890',
  spaceName: 'mi-hostreamly-storage',
  region: 'nyc3',
};
```

### 4. Regiones disponibles de DigitalOcean

- `nyc3` - Nueva York 3
- `ams3` - Ámsterdam 3
- `sgp1` - Singapur 1
- `fra1` - Frankfurt 1
- `sfo3` - San Francisco 3
- `tor1` - Toronto 1
- `blr1` - Bangalore 1

### 5. Después de configurar

1. **Guarda el archivo** `digitalocean-credentials.js`
2. **Reinicia el servidor** ejecutando en la terminal:
   ```bash
   npm run dev
   ```
3. **Verifica la conexión** visitando: http://localhost:8080/

### 6. ¿Dónde obtener las credenciales?

1. Ve a [DigitalOcean Cloud](https://cloud.digitalocean.com/)
2. Navega a **API** → **Spaces Keys**
3. Crea una nueva clave o usa una existente
4. Copia el **Access Key ID** y **Secret Access Key**
5. El **Space Name** es el nombre que le diste a tu Space
6. La **Region** es donde creaste tu Space

### 7. Verificar que funciona

✅ **Señales de que está funcionando:**
- El servidor inicia sin errores
- Puedes ver información de DigitalOcean en el dashboard
- Las pruebas de upload funcionan

❌ **Si hay errores:**
- Verifica que las credenciales sean correctas
- Asegúrate de que el Space existe
- Confirma que la región sea la correcta

### 8. Seguridad

⚠️ **IMPORTANTE:**
- NO compartas el archivo `digitalocean-credentials.js`
- NO lo subas a repositorios públicos
- Mantén tus credenciales privadas

---

## 🆘 ¿Necesitas ayuda?

Si tienes problemas:
1. Verifica que todos los campos estén completados
2. Asegúrate de que no haya espacios extra
3. Confirma que las comillas estén correctas
4. Reinicia el servidor después de los cambios

¡Listo! Tu integración con DigitalOcean Spaces estará funcionando. 🚀