import type { ChatMessage } from 'chatgpt-web'

export namespace types {
    export interface Conversation {
        id: string
        title: string
        messages: Message[]
        knowledge: string[]
        createdAt: Date
        updatedAt: Date
        type?: 'chat' | 'embbeded'
        systemMessage?: string
    }

    export interface Message extends ChatMessage {
        updatedAt: Date
        createdAt: Date
    }

    export interface KnowledgeItem {
        id: string
        title: string
        type: string
        sections: { content: string; embedding?: number[]; url?: string }[]
        updatedAt: Date
        metadata: any
    }

    export interface WebScraperResult {
        url: string
        markdown: string
        favicon: string
        title: string
    }

}
