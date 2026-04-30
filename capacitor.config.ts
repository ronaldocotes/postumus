import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.funeraria.cobranca",
  appName: "Funeraria Cobrança",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Camera: {
      allowEditing: false,
      resultType: "uri",
    },
    Geolocation: {
      enabled: true,
    },
  },
};

export default config;
