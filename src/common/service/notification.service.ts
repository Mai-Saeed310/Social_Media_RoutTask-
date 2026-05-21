import admin from "firebase-admin";
import {resolve} from "node:path"
import { readFileSync } from "node:fs";


class NotificationServie {
    private readonly client: admin.app.App ; 

    constructor (){
    const serviceAccount = JSON.parse(
    readFileSync(
        resolve(__dirname, "../../config/social-media-app-3e9bf-firebase-adminsdk-fbsvc-0745f86273.json"),
        "utf-8"
    )
    );

    this.client = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
    });

    }
    
    async sendNotification({
    token,
    data
    }: {
    token: string,
    data: { title: string, body: string }
    }) {
    const message = {
        token,
        data
    }
    return await this.client.messaging().send(message)
    }

    async sendNotifications({
    tokens,
    data
    }: {
    tokens: string[],
    data: { title: string, body: string }
    }) {
    await Promise.all(tokens.map((token) => {
        return this.sendNotification({ token, data })
    }))
    }
    
}

export default new NotificationServie();