# Funeraria Cobrança - Guia de Build Rápido

## ⚡ Build Rápido (Windows)

### Opção 1: Usando Android Studio (Recomendado)

1. **Instale o Android Studio**:
   - Baixe em: https://developer.android.com/studio
   - Durante instalação, aceite instalar o Android SDK

2. **Configure o projeto**:
   ```powershell
   # Na pasta do projeto
   cd C:\Users\sdcot\funeraria-system
   
   # Build do frontend
   npm run build
   
   # Copia build para pasta mobile
   xcopy /E /I dist mobile-app\android\app\src\main\assets\public
   ```

3. **Abra no Android Studio**:
   - Abra Android Studio
   - File → Open → Selecione `mobile-app\android`
   - Aguarde sincronização do Gradle

4. **Gere o APK**:
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - O APK será gerado em: `mobile-app\android\app\build\outputs\apk\debug\app-debug.apk`

### Opção 2: APK Debug Simples

Se você já tem o Android SDK configurado:

```powershell
# Navegue até a pasta android
cd mobile-app\android

# Build debug
.\gradlew.bat assembleDebug

# APK estará em:
# app\build\outputs\apk\debug\app-debug.apk
```

## 📱 Instalação no Celular

### Método 1: Cabo USB
1. Ative **Modo Desenvolvedor** no Android
2. Ative **Depuração USB**
3. Conecte o celular ao PC
4. No Android Studio: Run → Run 'app'

### Método 2: APK Direto
1. Copie o `app-debug.apk` para o celular
2. No celular, permita instalação de fontes desconhecidas
3. Instale o APK

## 🔧 Configuração do Servidor

Edite o arquivo `capacitor.config.ts` para apontar para seu servidor:

```typescript
server: {
  url: "https://seu-servidor.com",
  cleartext: true
}
```

Para teste local (mesma rede WiFi):
```typescript
server: {
  url: "http://192.168.1.XXX:3000", // IP do seu PC
  cleartext: true
}
```

## 🐛 Solução de Problemas

### "Gradle sync failed"
- File → Invalidate Caches → Invalidate and Restart

### "SDK not found"
- File → Settings → Appearance & Behavior → System Settings → Android SDK
- Instale Android SDK Platform 34

### App não conecta ao servidor
- Verifique se o PC e celular estão na mesma rede
- Verifique firewall do Windows
- Use o IP correto do PC na rede

## 📋 Checklist Pré-Build

- [ ] `npm run build` executado com sucesso
- [ ] Pasta `dist` criada com arquivos
- [ ] Arquivos copiados para `mobile-app/android/app/src/main/assets/public`
- [ ] Android Studio instalado
- [ ] Android SDK 34 instalado
- [ ] JDK 17 instalado

## 🚀 Próximos Passos

Para publicar na Play Store, você precisará:
1. Gerar uma keystore para assinar o app
2. Criar conta de desenvolvedor Google ($25)
3. Gerar AAB (Android App Bundle) ao invés de APK
4. Enviar para a Play Store Console

## 📞 Suporte

Em caso de problemas, verifique:
- Logs do Android Studio (Logcat)
- Console do navegador (Chrome DevTools)
- Logs do servidor Next.js
