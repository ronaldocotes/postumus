# Funeraria Cobrança - App Android

## Estrutura do Projeto Mobile

Este diretório contém os arquivos necessários para gerar o APK do app de cobrança.

## Pré-requisitos

1. **Android Studio** instalado
2. **JDK 17** ou superior
3. **Node.js** 18+
4. **Capacitor CLI** instalado globalmente:
   ```bash
   npm install -g @capacitor/cli
   ```

## Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

```env
# API URL (seu servidor backend)
NEXT_PUBLIC_API_URL=https://seu-servidor.com/api

# VAPID Keys para notificações push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua_chave_publica
VAPID_PRIVATE_KEY=sua_chave_privada
```

### 2. Build do Frontend

```bash
# Na raiz do projeto
npm run build
```

### 3. Sincronizar com Capacitor

```bash
npx cap sync android
```

### 4. Abrir no Android Studio

```bash
npx cap open android
```

### 5. Gerar APK

No Android Studio:
1. Vá em **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Ou use: **Build** → **Generate Signed Bundle / APK** (para produção)

## Permissões do App

O app requer as seguintes permissões:

- **INTERNET** - Conexão com servidor
- **CAMERA** - Fotos dos comprovantes
- **ACCESS_FINE_LOCATION** - GPS para check-in
- **POST_NOTIFICATIONS** - Notificações push (Android 13+)

## Estrutura de Arquivos

```
android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── java/
│   │   │   │   └── com/funeraria/cobranca/
│   │   │   │       └── MainActivity.java
│   │   │   └── res/
│   │   │       ├── drawable/
│   │   │       ├── layout/
│   │   │       ├── mipmap-hdpi/
│   │   │       ├── mipmap-mdpi/
│   │   │       ├── mipmap-xhdpi/
│   │   │       ├── mipmap-xxhdpi/
│   │   │       ├── mipmap-xxxhdpi/
│   │   │       └── values/
│   │   └── test/
│   └── build.gradle
├── build.gradle
└── settings.gradle
```

## Configurações Importantes

### AndroidManifest.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.funeraria.cobranca">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        
        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            
        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"></meta-data>
        </provider>
    </application>
</manifest>
```

### build.gradle (App)

```gradle
plugins {
    id 'com.android.application'
}

android {
    namespace 'com.funeraria.cobranca'
    compileSdk 34

    defaultConfig {
        applicationId "com.funeraria.cobranca"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.9.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.webkit:webkit:1.8.0'
    implementation project(':capacitor-android')
}
```

## Teste Local

Para testar o app em um emulador ou dispositivo físico:

1. **Emulador**: Use o Android Studio para criar um emulador
2. **Dispositivo físico**:
   - Ative **Modo Desenvolvedor** no Android
   - Ative **Depuração USB**
   - Conecte via USB e permita a depuração
   - Execute: `npx cap run android`

## Distribuição

Para distribuir o app:

1. **APK Debug**: Compartilhe o arquivo `app-debug.apk`
2. **APK Release**: Assine o APK com uma keystore
3. **Google Play**: Gere um Android App Bundle (AAB)

## Solução de Problemas

### Erro de CORS
Configure seu servidor para aceitar requisições do app:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

### GPS não funciona
Verifique se a permissão de localização foi concedida nas configurações do app.

### Câmera não abre
Verifique se a permissão de câmera foi concedida.

## Suporte

Para mais informações, consulte:
- [Documentação do Capacitor](https://capacitorjs.com/docs)
- [Documentação do Android](https://developer.android.com/docs)
