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
        metadata?: ConversationMetadata
        settings?: ConversationSettings
    }

    export interface ConversationMetadata {
        favorite?: boolean
    }

    export interface ConversationSettings {
        personaId?: string
        model?: string | null
        maxTokens?: number
        creativity?: Creativity | null
    }

    export interface Message extends ChatMessage {
        updatedAt: Date
        createdAt: Date
        isError?: boolean
        metadata?: MessageMetadata
        actions?: any[]
    }

    export interface MessageMetadata {
        favorite?: boolean
    }

    export interface Persona {
        title: string
        instructions: string
        id: string
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

    export type Creativity = 'none' | 'normal' | 'high'

    // Deta namespace
    export namespace deta {
        export interface Conversation {
            key: string
            title: string
            updatedAt: string
            createdAt: string
            metadata?: ConversationMetadata
        }

        export interface Message {
            key: string
            conversationId: string
            text: string
            role: string
            updatedAt: string
            createdAt: string
            parentMessageId?: string
        }
    }

}
