import type { ChatMessage } from 'chatgpt-web'

export namespace types {
    export interface Conversation {
        id: string
        title: string
        messages: Message[]
        createdAt: Date
        updatedAt: Date
    }

    export interface Message extends ChatMessage {
        updatedAt: Date
    }
}
