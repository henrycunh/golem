import type { ChatMessage } from 'chatgpt-web'
import { nanoid } from 'nanoid'
import { Configuration, OpenAIApi } from 'openai'
import pLimit from 'p-limit'
import { encode } from 'gpt-token-utils'
import type { types } from '~~/utils/types'
import trimIndent from '~~/utils/string'

const MaxTokensPerModel = {
    'gpt-4': 8180,
    'gpt-3.5-turbo': 10000,
} as Record<string, number>

export const useConversations = () => {
    const db = useIDB()

    const { isDetaEnabled, deta } = useDeta()
    const { apiKey } = useSettings()
    const { maxTokens, modelUsed } = useSettings()
    const { knowledgeList } = useKnowledge()
    const { complete } = useLanguageModel()

    const currentConversationId = useState<string>(() => '')
    const currentConversation = useState<types.Conversation | null>(() => null)
    const conversationList = useState<types.Conversation[] | null>(() => null)
    const conversationAbortMap = useState<Record<string, AbortController>>(() => ({}))

    const knowledgeUsedInConversation = computed(() => {
        if (currentConversation.value === null) {
            return []
        }
        return currentConversation.value.knowledge?.map((knowledgeId) => {
            return knowledgeList.value?.find(knowledge => knowledge.id === knowledgeId)
        }).filter(knowledge => knowledge !== undefined) || [] as types.KnowledgeItem[]
    })
    const isTyping = useState<Record<string, boolean>>(() => ({}))
    const isTypingInCurrentConversation = computed(() => {
        return isTyping.value[currentConversationId.value] || false
    })
    const followupQuestions = useState<Record<string, Array<string>> | null>(() => null)

    async function listConversations() {
        return await db.table('conversations').toArray()
    }

    async function updateConversationList() {
        conversationList.value = await listConversations()
    }

    async function getConversationById(id: string) {
        return await db.table('conversations').get(id)
    }

    async function createConversation(title: string, options?: Partial<types.Conversation>) {
        const newConversation: types.Conversation = {
            id: nanoid(),
            title,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            knowledge: [],
            ...options,
        }
        const newKey = await db.table('conversations').add(newConversation)
        if (!newKey) {
            throw new Error('Échec de la création de la conversation')
        }
        if (isDetaEnabled.value) {
            deta.conversation.create(newConversation)
        }
        await updateConversationList()
        return newConversation
    }

    async function cloneConversation(conversationId: string, lastMessageId?: string, titlePrefix?: string) {
        const titlePrefixWithDefault = titlePrefix || 'Copy: '
        const originConversation = await getConversationById(conversationId)
        let messageList: ChatMessage[] = []

        if (lastMessageId) {
            const lastMessage = await getMessageById(conversationId, lastMessageId)
            messageList = getMessageChain(originConversation.messages, lastMessage)
        }
        else {
            messageList = originConversation.messages
        }

        await createConversation(
            '',
            {
                ...originConversation,
                id: nanoid(),
                title: [titlePrefixWithDefault, originConversation.title].join(''),
                messages: messageList,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        )
    }

    async function forkConversation(id: string, lastMessageId: string) {
        await cloneConversation(id, lastMessageId, 'Fork: ')
    }

    async function addMessageToConversation(id: string, message: ChatMessage) {
        const conversation = await db.table('conversations').get(id)
        if (!conversation) {
            throw new Error('Conversation introuvable')
        }
        const updatedMessage = getUpdatedMessage(message, conversation.id)

        const newConversation = {
            ...conversation,
            messages: [...conversation.messages, updatedMessage],
            updatedAt: new Date(),
        }
        await db.table('conversations').put(newConversation)
        if (isDetaEnabled.value) {
            deta.message.create(updatedMessage)
        }
        if (currentConversationId.value === id) {
            currentConversation.value = newConversation
        }
    }

    async function getMessageById(conversationId: string, id: string) {
        const conversation = await db.table('conversations').get(conversationId)
        if (!conversation) {
            throw new Error('Conversation introuvable')
        }
        return conversation.messages.find((message: ChatMessage) => message.id === id) as ChatMessage
    }

    async function updateLastAssistantMessage(conversationId: string, message: types.Message) {
        const conversation = await db.table('conversations').get(conversationId)
        if (!conversation) {
            throw new Error('Conversation introuvable')
        }
        const systemMessages = conversation.messages.filter((message: ChatMessage) => message.role === 'assistant')
        if (systemMessages.length === 0) {
            return null
        }
        const lastSystemMessage = systemMessages[systemMessages.length - 1]
        if (!lastSystemMessage) {
            return null
        }

        const newConversation = {
            ...conversation,
            messages: conversation.messages.map((currentMessage: ChatMessage) => {
                if (currentMessage.id === lastSystemMessage.id) {
                    return {
                        ...currentMessage,
                        ...message,
                        updatedAt: new Date(),
                    }
                }
                return currentMessage
            }),
            updatedAt: new Date(),
        }
        await db.table('conversations').put(newConversation)
        if (currentConversationId.value === conversationId) {
            currentConversation.value = newConversation
        }
    }

    const updateConversation = async (id: string, update: Partial<types.Conversation>) => {
        const conversation = await db.table('conversations').get(id)
        if (!conversation) {
            throw new Error('Conversation introuvable')
        }
        const newConversation: types.Conversation = {
            ...conversation,
            ...update,
        }

        await db.table('conversations').put(newConversation)
        if (isDetaEnabled.value) {
            deta.conversation.update(newConversation)
        }
        await updateConversationList()
        if (currentConversationId.value === id) {
            currentConversation.value = newConversation
        }
    }

    const updateConversationSettings = async (id: string, update: Partial<types.ConversationSettings>) => {
        const conversation: types.Conversation = await db.table('conversations').get(id)
        if (!conversation) {
            throw new Error('Conversation introuvable')
        }
        const newConversation: types.Conversation = {
            ...conversation,
            settings: {
                ...conversation.settings,
                ...update,
            },
        }
        logger.info('Updating conversation settings')
        await updateConversation(id, newConversation)
    }

    const deleteConversation = async (id: string) => {
        await db.table('conversations').delete(id)
        if (isDetaEnabled.value) {
            deta.conversation.delete(id)
        }
        await updateConversationList()
    }

    async function addErrorMessage(message: string) {
        if (!currentConversation.value) {
            return
        }
        const newMessage: types.Message = {
            id: nanoid(),
            role: 'assistant' as const,
            text: message,
            updatedAt: new Date(),
            createdAt: new Date(),
            isError: true,
        }
        await addMessageToConversation(currentConversation.value.id, newMessage)
    }

    async function clearErrorMessages() {
        if (!currentConversation.value) {
            return
        }
        const conversation = await getConversationById(currentConversation.value.id)
        if (!conversation) {
            return
        }
        const newMessages = conversation.messages.filter((message: types.Message) => !message.isError)
        await updateConversation(currentConversation.value.id, {
            messages: [...newMessages],
        })
    }

    const sendMessage = async (message: string, selectedChoices: boolean, monchoixGraph: string, monchoixIntData: string) => {
        if (!process.client) {
            return
        }

        logger.info('CHOIX EXECUTION SEND MESSAGE', selectedChoices)
        logger.info('CHOIX EXECUTION SEND MESSAGE monchoixGraph ', monchoixGraph)
        logger.info('CHOIX EXECUTION SEND MESSAGE monchoixIntData', monchoixIntData)

        const fromConversation = currentConversation.value
        if (!fromConversation) {
            return
        }

        const assistantMessageList = (fromConversation.messages || []).filter((message: ChatMessage) => message.role === 'assistant')
        const lastAssistantMessage = assistantMessageList[assistantMessageList.length - 1]
        const userMessage = {
            id: nanoid(),
            role: 'user' as const,
            text: message,
            parentMessageId: lastAssistantMessage?.id,
            updatedAt: new Date(),
        }

        // Adds the user message to the conversation
        addMessageToConversation(fromConversation.id, userMessage)
        console.log(`ID DE CONVERSATION ID DE CONVERSATION IDDDDD COVERSATION=>>>>>>>>>> ${fromConversation.id}`)
        setConversationTypingStatus(fromConversation.id, true)

        let messageList: any[] = getMessageChain(fromConversation.messages, userMessage)
        messageList = [
            {
                role: 'system',
                text: fromConversation.systemMessage || getDefaultSystemMessage(),
                id: 'system-message',
            },
            /* {
                role: 'user',
                text: '\'voici le schema de la table tbl_users \'tbl_users\', \'CREATE TABLE `tbl_users` (`id` int(11) unsigned NOT NULL AUTO_INCREMENT,`name` varchar(200) DEFAULT NULL,`prenom` varchar(200) DEFAULT NULL,`telephone` varchar(10) DEFAULT NULL,`annee_naissance` varchar(4) DEFAULT NULL,`poste` varchar(200) DEFAULT NULL,`entreprise` int(11) unsigned DEFAULT NULL,`site` int(11) DEFAULT NULL,`responsable` int(11) unsigned DEFAULT NULL,`email` varchar(127) DEFAULT NULL,`username` varchar(100) NOT NULL DEFAULT \'\',`password` char(50) DEFAULT NULL,`confirmed` tinyint(1) NOT NULL DEFAULT 0,`phone_confirmed` int(1) NOT NULL DEFAULT 0,`public_profile` tinyint(1) NOT NULL DEFAULT 1,`approved` tinyint(1) NOT NULL DEFAULT 0,`description` text DEFAULT NULL,`matricule` varchar(100) DEFAULT NULL,`department` varchar(100) DEFAULT NULL,`active` int(11) NOT NULL DEFAULT 1,`date_inscription` datetime DEFAULT NULL,`previously_admin` int(11) NOT NULL DEFAULT 0,`adresse_domicile` varchar(200) DEFAULT NULL,`site_travail` int(11) NOT NULL DEFAULT 0,`notify_user` int(11) NOT NULL DEFAULT 1,`total_view` int(11) NOT NULL DEFAULT 0,`alert_nouveau_user` int(11) DEFAULT 1,`user_lat` varchar(50) DEFAULT NULL,`user_lng` varchar(50) DEFAULT NULL,`last_update_position` datetime DEFAULT NULL,`profession` varchar(150) DEFAULT NULL,`jour_naissance` varchar(2) DEFAULT NULL,`mois_naissance` varchar(2) DEFAULT NULL,PRIMARY KEY(`id`),UNIQUE KEY`uniq_username`(`username`),KEY`users_entreprise_id_foreign`(`entreprise`),KEY`users_active_index`(`active`),KEY`respo`(`responsable`),KEY`site_travail`(`site_travail`)) ENGINE = MyISAM AUTO_INCREMENT = 2671 DEFAULT CHARSET = utf8 COLLATE = utf8_general_ci COMMENT = \'Stores registered users’ information\'',
                id: 'user-message',
            },
            {
                role: 'assistant',
                text: 'Merci jai bien reçu le schemas de la table tbl_users',
                id: 'assistant-message',
            },
            {
                role: 'user',
                text: 'voici le dictionnaire pour la table tbl_users: "id": "identifiant de l\'utilisateur","name": "nom de l\'utilisateur","prenom": "prénom de l\'utilisateur","telephone": "numéro de téléphone","annee_naissance": "année de naissance","poste": "poste occupé","entreprise": "nom de l\'entreprise","site": "site de travail","responsable": "responsable hiérarchique","email": "adresse e-mail","username": "nom d\'utilisateur","password": "mot de passe","confirmed": "confirmation","phone_confirmed": "numéro de téléphone confirmé","public_profile": "profil public","approved": "approuvé","description": "description","matricule": "matricule","department": "département","active": "actif","date_inscription": "date d\'inscription","previously_admin": "précédemment administrateur","adresse_domicile": "adresse domicile","site_travail": "site de travail","notify_user": "notification utilisateur","total_view": "total des vues","alert_nouveau_user": "alerte nouveau utilisateur","user_lat": "latitude de l\'utilisateur","user_lng": "longitude de l\'utilisateur","last_update_position": "dernière mise à jour de la position","profession": "profession","jour_naissance": "jour de naissance","mois_naissance": "mois de naissance"',
                id: 'user-message',
            },
            {
                role: 'assistant',
                text: 'Merci j\’ai bien reçu le dictionnaire de la table tbl_users',
                id: 'assistant-message',
            },
            {
                role: 'user',
                text: '\'voici le schema de la table tbl_vehicule \'tbl_vehicule\', \'CREATE TABLE `tbl_vehicule` (`id` int(11) NOT NULL AUTO_INCREMENT, `nom` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL, `marque` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL, `model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL, `annee_cir` int(4) DEFAULT NULL, `type_vehicule` varchar(50) DEFAULT NULL, `etat` int(11) DEFAULT 1 COMMENT \'0: inactif, 1: actif, 2: en maintenance, 3: hors service\', `conducteur` int(11) DEFAULT NULL, `dernier_conducteur` int(11) DEFAULT NULL, `date_depart` datetime DEFAULT NULL, `date_restitution` datetime DEFAULT NULL, `restituer` int(11) DEFAULT 0, `dernier_conducteur_date_reservation` datetime DEFAULT NULL, `disponible` int(11) NOT NULL DEFAULT 1, `latitude` double DEFAULT NULL, `longitude` double DEFAULT NULL, `derniere_position` varchar(100) DEFAULT NULL, `status` int(11) DEFAULT NULL, `speed` int(11) DEFAULT NULL, `totalDistance` float DEFAULT NULL, `fuelCapacity` float(12,0) DEFAULT NULL, `fuel_consumption_auj` float DEFAULT 0, `fuel_per_100` varchar(45) DEFAULT NULL, `urbanFuelConsumption` float DEFAULT NULL, `volumeCapacity` int(11) DEFAULT NULL, `usageStart` varchar(50) DEFAULT NULL, `usageStop` varchar(100) DEFAULT \'3000\' COMMENT \'Kilométrage auquel il faudra efectuer la prochaine révision du véhicule\', `driver` varchar(145) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL, `active` tinyint(1) DEFAULT 0, `type_carburant` varchar(100) DEFAULT NULL, `adresse_street` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL, `adresse_city` varchar(100) DEFAULT NULL, `adresse_country` varchar(100) DEFAULT NULL, PRIMARY KEY (`id`), KEY `marque` (`marque`), KEY `model` (`model`)) ENGINE=MyISAM AUTO_INCREMENT=4735 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;',
                id: 'user-message',
            },
            {
                role: 'assistant',
                text: 'Merci jai bien reçu le schemas de la table tbl_vehicule',
                id: 'assistant-message',
            },
            {
                role: 'user',
                text: 'voici le dictionnaire pour la table tbl_vehicule: "id": "Identifiant unique du véhicule", "nom": "Nom ou numéro d\'identification du véhicule", "marque": "Marque du véhicule", "model": "Modèle du véhicule", "annee_cir": "Année de mise en circulation du véhicule", "type_vehicule": "Type de véhicule(voiture, moto, camion, etc.) ", "etat": "État du véhicule(actif, en maintenance, hors service, etc.) ", "conducteur": "ID du conducteur actuellement assigné au véhicule", "dernier_conducteur": "ID du dernier conducteur ayant utilisé le véhicule", "date_depart": "Date de départ prévue ou effective du véhicule", "date_restitution": "Date de restitution prévue ou effective du véhicule", "restituer": "Indicateur de statut de restitution du véhicule", "dernier_conducteur_date_reservation": "Date de la dernière réservation par le conducteur", "disponible": "Indicateur de disponibilité du véhicule", "latitude": "Coordonnées GPS actuelles du véhicule(latitude)", "longitude": "Coordonnées GPS actuelles du véhicule(longitude)", "derniere_position": "Dernière position connue du véhicule", "status": "Statut du véhicule", "speed": "Vitesse actuelle du véhicule", "totalDistance": "Distance totale parcourue par le véhicule", "fuelCapacity": "Capacité du réservoir de carburant du véhicule", "fuel_consumption_auj": "Consommation de carburant actuelle du véhicule", "fuel_per_100": "Consommation moyenne de carburant pour 100 km", "urbanFuelConsumption": "Consommation moyenne de carburant en milieu urbain", "volumeCapacity": "Capacité de chargement du véhicule(volume)", "usageStart": "Heures de début d\'utilisation quotidienne du véhicule", "usageStop": "Heures de fin d\'utilisation quotidienne du véhicule", "driver": "Nom du conducteur actuellement assigné", "active": "Indicateur d\'activité du véhicule", "type_carburant": "Type de carburant utilisé par le véhicule", "adresse_street": "Adresse actuelle du véhicule (rue)", "adresse_city": "Adresse actuelle du véhicule (ville)", "adresse_country": "Adresse actuelle du véhicule (pays)',
                id: 'user-message',
            },
            {
                role: 'assistant',
                text: 'Merci j\’ai bien reçu le dictionnaire de la table tbl_vehicule',
                id: 'assistant-message',
            },
            {
                role: 'user',
                text: '\'voici le schema de la table tbl_incidents \'tbl_incidents\', \'CREATE TABLE `tbl_incidents` (`id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, `user_id` int(11) unsigned DEFAULT NULL, `id_vehicule` int(11) DEFAULT NULL, `reservation_id` int(11) DEFAULT NULL, `entreprise_id` int(11) DEFAULT NULL, `incident_title` varchar(255) DEFAULT NULL, `incident_description` longtext DEFAULT NULL, `incident_date` datetime DEFAULT NULL, `incident_mode` tinyint(4) NOT NULL DEFAULT 1 COMMENT \'1 - WEB, 2 - SMS, 3 - EMAIL, 4 - TWITTER\', `incident_active` tinyint(4) NOT NULL DEFAULT 0, `incident_verified` tinyint(4) NOT NULL DEFAULT 0, `description_incident` text DEFAULT NULL, `valide` int(11) DEFAULT 0, `incident_km` float DEFAULT NULL, `incident_commentaire` text DEFAULT NULL, `lieu_incident` varchar(255) DEFAULT NULL, `lieu_incident_coords` varchar(100) DEFAULT NULL, `date_validation` datetime DEFAULT NULL, `traite` int(11) DEFAULT 0 COMMENT \'0 : incident non traité, 1: incident traité\', `classification` varchar(100) DEFAULT NULL, `type_garantie` varchar(200) DEFAULT NULL, `etat_label` varchar(50) NOT NULL DEFAULT \'Non traité\', `valide_label` varchar(50) NOT NULL DEFAULT \'En attente\', `date_reparation` datetime DEFAULT NULL, `date_reception` datetime DEFAULT NULL, `delai` varchar(45) DEFAULT NULL, `Country` varchar(150) NOT NULL DEFAULT \'Côte d\'Ivoire\', `ville` varchar(100) NOT NULL DEFAULT \'null\', PRIMARY KEY(`id`), KEY`vehicule_id`(`id_vehicule`), KEY`user_id`(`user_id`), KEY`entreprise_id`(`entreprise_id`, `active`), KEY`incident_date`(`incident_date`), KEY`reservation_id`(`reservation_id`), CONSTRAINT`fk_incidents_user` FOREIGN KEY(`user_id`) REFERENCES`tbl_users`(`user_id`), CONSTRAINT`fk_incidents_vehicule` FOREIGN KEY(`id_vehicule`) REFERENCES`tbl_vehicule`(`id`), CONSTRAINT`fk_incidents_reservation` FOREIGN KEY(`reservation_id`) REFERENCES`tbl_reservations`(`id`), CONSTRAINT`fk_incidents_entreprise` FOREIGN KEY(`entreprise_id`) REFERENCES`tbl_entreprise`(`id`)) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_general_ci;',
                id: 'user-message',
            },
            {
                role: 'assistant',
                text: 'Merci jai bien reçu le schemas de la table tbl_incidents',
                id: 'assistant-message',
            },
            {
                role: 'user',
                text: 'voici le dictionnaire pour la table tbl_incidents: "user_id":"Identifiant de l\'utilisateur associé à l\'incident.","id_vehicule":"Identifiant du véhicule lié à l\'incident.","reservation_id":"Identifiant de la réservation associée à l\'incident.","entreprise_id":"Identifiant de l\'entreprise associée à l\'incident.","incident_title":"Titre de l\'incident.","incident_description":"Description détaillée de l\'incident.","incident_date":"Date de l\'incident.","incident_mode":"Mode de l\'incident.","incident_active":"Indicateur d\'activité de l\'incident.","incident_verified":"Indicateur de vérification de l\'incident.","incident_alert_status":"Statut d\'alerte associé à l\'incident.","description_incident":"Description de l\'incident.","valide":"Indicateur de validation de l\'incident.","incident_km":"Kilométrage associé à l\'incident.","incident_commentaire":"Commentaire lié à l\'incident.","lieu_incident":"Lieu de l\'incident.","lieu_incident_coords":"Coordonnées du lieu de l\'incident.","date_validation":"Date de validation de l\'incident.","traite":"Indicateur de traitement de l\'incident.","classification":"Classification de l\'incident.","type_garantie":"Type de garantie associé à l\'incident.","etat_label":"Étiquette de l\'état de l\'incident.","valide_label":"Étiquette de validation de l\'incident.","date_reparation":"Date de réparation de l\'incident.","date_reception":"Date de réception de l\'incident.","delai":"Délai lié à l\'incident.","Country":"Pays de l\'incident.","ville":"Ville de l\'incident."',
                id: 'user-message',
            },
            {
                role: 'assistant',
                text: 'Merci j\’ai bien reçu le dictionnaire de la table tbl_incidents',
                id: 'assistant-message',
            }, */
            /* {
                role: 'user',
                text: '\'voici le schema de la table tbl_incidents \'tbl_incidents\', \'CREATE TABLE `tbl_incidents` (\n  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,\n  `user_id` int(11) unsigned DEFAULT NULL,\n  `id_vehicule` int(11) DEFAULT NULL,\n  `id_time` int(11) DEFAULT NULL,\n  `incident_title` varchar(255) DEFAULT NULL,\n  `incident_description` longtext DEFAULT NULL,\n  `incident_date` datetime DEFAULT NULL,\n  `incident_mode` tinyint(4) NOT NULL DEFAULT 1 COMMENT \'1 - WEB, 2 - SMS, 3 - EMAIL, 4 - TWITTER\',\n  `incident_active` tinyint(4) NOT NULL DEFAULT 0,\n  `incident_verified` tinyint(4) NOT NULL DEFAULT 0,\n  `incident_dateadd` datetime DEFAULT NULL,\n  `incident_dateadd_gmt` datetime DEFAULT NULL,\n  `incident_datemodify` datetime DEFAULT NULL,\n  `incident_alert_status` tinyint(4) NOT NULL DEFAULT 0 COMMENT \'0 - Not Tagged for Sending, 1 - Tagged for Sending, 2 - Alerts Have Been Sent\',\n  `incident_zoom` tinyint(4) DEFAULT NULL,\n  `reservation_id` int(11) DEFAULT NULL,\n  `description_incident` text DEFAULT NULL,\n  `entreprise_id` int(11) DEFAULT NULL COMMENT \'Id de l\'\'entreprise\',\n  `valide_by` int(11) DEFAULT NULL,\n  `valide` int(11) DEFAULT 0,\n  `date_valide` datetime DEFAULT NULL,\n  `incident_km` float DEFAULT NULL,\n  `incident_commentaire` text DEFAULT NULL,\n  `affectation_id` int(11) DEFAULT NULL,\n  `add_by` int(11) DEFAULT NULL,\n  `modif_by` int(11) DEFAULT NULL,\n  `active` int(11) DEFAULT 1,\n  `raisonannulation` text DEFAULT NULL,\n  `lieu_incident` varchar(255) DEFAULT NULL,\n  `lieu_incident_coords` varchar(100) DEFAULT NULL,\n  `lieu_incident_lat` float(45,9) DEFAULT NULL,\n  `lieu_incident_long` float(45,9) DEFAULT NULL,\n  `date_validation` datetime DEFAULT NULL,\n  `traite` int(11) DEFAULT 0 COMMENT \'0 : incident non traité, 1 : incident traité\',\n  `maintenance_id` int(11) DEFAULT NULL,\n  `direction_id` int(11) DEFAULT NULL,\n  `classification` varchar(100) DEFAULT NULL,\n  `type_garantie` varchar(200) DEFAULT NULL,\n  `etat_label` varchar(50) NOT NULL DEFAULT \'Non traité\',\n  `valide_label` varchar(50) NOT NULL DEFAULT \'En attente\',\n  `date_reparation` datetime DEFAULT NULL,\n  `date_reception` datetime DEFAULT NULL,\n  `delai` varchar(45) DEFAULT NULL,\n  `Country` varchar(150) NOT NULL DEFAULT \'Côte d\'\'Ivoire\',\n  `ville` varchar(100) NOT NULL DEFAULT \'null\',\n  PRIMARY KEY (`id`),\n  KEY `vehicule_id` (`id_vehicule`),\n  KEY `user_id` (`user_id`),\n  KEY `entreprise_id` (`entreprise_id`,`active`),\n  KEY `incident_date` (`incident_date`),\n  KEY `maintenance_id` (`maintenance_id`),\n  KEY `direction_id` (`direction_id`)\n) ENGINE=MyISAM AUTO_INCREMENT=146 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT=\'Stores reports submitted\'\'',
                id: 'user-message',
            },
            {
                role: 'assistant',
                text: 'Merci jai bien reçu le schemas de la table tbl_incidents',
                id: 'assistant-message',
            },
            {
                role: 'user',
                text: 'voici le dictionnaire pour la table tbl_users: "id": "identifiant de l\'utilisateur", "gpswox_id": "identifiant gpswox", "gpswox_driver_id": "identifiant gpswox du chauffeur", "invite_by": "invitation par", "riverid": "identifiant riverid", "name": "nom de l\'utilisateur", "prenom": "prénom de l\'utilisateur", "ibutton_id": "identifiant iButton", "telephone_old": "ancien numéro de téléphone", "telephone": "numéro de téléphone", "annee_naissance": "année de naissance", "poste": "poste occupé", "entreprise": "nom de l\'entreprise", "site": "site de travail", "responsable": "responsable hiérarchique", "email": "adresse e-mail", "username": "nom d\'utilisateur", "password": "mot de passe", "deviceid": "identifiant du dispositif", "logins": "connexions", "last_login": "dernière connexion", "loginsapi": "connexions API", "last_loginapi": "dernière connexion API","gestionnaire_site": "gestionnaire de site", "notify_vehicule_non_reserve": "notification véhicule non réservé", "updated": "date de mise à jour", "color": "couleur", "code": "code", "confirmed": "confirmation", "phone_confirmed": "numéro de téléphone confirmé", "code_confirmation": "code de confirmation", "public_profile": "profil public", "approved": "approuvé", "needinfo": "besoin d\'informations", "img": "image", "created": "date de création", "failed_attempts": "tentatives de connexion échouées", "last_attempt": "dernière tentative", "newlester": "nouveautés", "sexe": "sexe", "adresse": "adresse", "description": "description", "matricule": "matricule", "department": "département", "active": "actif", "date_inscription": "date d\'inscription", "previously_admin": "précédemment administrateur", "adresse_domicile": "adresse domicile", "site_travail": "site de travail", "notify_user": "notification utilisateur", "total_view": "total des vues", "alert_opc_mobile": "alerte mobile OPC", "alert_nouveau_user": "alerte nouveau utilisateur", "user_lat": "latitude de l\'utilisateur", "user_lng": "longitude de l\'utilisateur", "last_update_position": "dernière mise à jour de la position", "checkDriverArrived": "vérifier si le conducteur est arrivé", "checkTripStarted": "vérifier si le trajet a commencé", "checkTripEnd": "vérifier si le trajet est terminé", "profession": "profession", "jour_naissance": "jour de naissance", "mois_naissance": "mois de naissance", "friends_facebook": "amis Facebook", "type_user": "type d\'utilisateur", "type_user_vrai": "type d\'utilisateur vrai", "mc_device": "dispositif MC", "mc_id": "identifiant MC", "commercial_id": "identifiant commercial", "date_create_mc": "date de création MC", "position_create_mc": "position de création MC", "observation_mc": "observation MC", "verified_mc": "MC vérifié", "assurance_id": "identifiant d\'assurance", "date_souscription": "date de souscription", "formule": "formule d\'assurance", "last_paiement_assurance": "dernier paiement d\'assurance", "compte_paiement": "compte de paiement", "num_paiement": "numéro de paiement", "lieu_naissance": "lieu de naissance", "permis_confirmed": "permis confirmé", "cni_confirmed": "CNI confirmée", "photo_confirmed": "photo confirmée", "addpreference": "préférences additionnelles", "enregistrement_basic": "enregistrement de base", "adresse_lat": "latitude de l\'adresse", "adresse_lng": "longitude de l\'adresse", "trajet_domicile_travail_passager": "trajet domicile-travail en tant que passager", "trajet_domicile_travail": "trajet domicile-travail", "amsa_phase2": "AMS-A phase 2", "passer_etape_sms": "passer l\'étape SMS", "clic_lien_sms": "clic sur le lien SMS", "service": "service", "code_parainnage": "code de parrainage", "direction": "direction", "cg_confirmed": "CG confirmée", "black_friday_confirmed": "Black Friday confirmé", "role": "rôle", "gestion": "gestion"',
                id: 'user-message',
            },
            {
                role: 'assistant',
                text: 'Merci jai bien reçu le dictionnaire de la table tbl_users',
                id: 'assistant-message',
            },
            {
                role: 'user',
                text: 'voici le dictionnaire pour la table tbl_incidents: "id": "identifiant de l\'incident", "user_id": "identifiant de l\'utilisateur", "id_vehicule": "identifiant du véhicule", "id_time": "identifiant du temps", "incident_title": "titre de l\'incident", "incident_description": "description de l\'incident", "incident_date": "date de l\'incident", "incident_mode": "mode de l\'incident", "incident_active": "incident actif", "incident_verified": "incident vérifié", "incident_dateadd": "date d\'ajout de l\'incident", "incident_dateadd_gmt": "date d\'ajout de l\'incident (GMT)", "incident_datemodify": "date de modification de l\'incident", "incident_alert_status": "statut d\'alerte de l\'incident", "incident_zoom": "zoom de l\'incident", "reservation_id": "identifiant de la réservation", "description_incident": "description de l\'incident", "entreprise_id": "identifiant de l\'entreprise", "valide_by": "validé par", "valide": "validé", "date_valide": "date de validation", "incident_km": "kilométrage de l\'incident", "incident_commentaire": "commentaire sur l\'incident", "affectation_id": "identifiant de l\'affectation", "add_by": "ajouté par", "modif_by": "modifié par", "active": "actif", "raisonannulation": "raison de l\'annulation", "lieu_incident": "lieu de l\'incident", "lieu_incident_coords": "coordonnées du lieu de l\'incident", "lieu_incident_lat": "latitude du lieu de l\'incident", "lieu_incident_long": "longitude du lieu de l\'incident", "date_validation": "date de validation", "traite": "traité", "maintenance_id": "identifiant de la maintenance", "direction_id": "identifiant de la direction", "classification": "classification de l\'incident", "type_garantie": "type de garantie", "etat_label": "étiquette de l\'état", "valide_label": "étiquette de validation", "date_reparation": "date de réparation", "date_reception": "date de réception", "delai": "délai", "Country": "pays", "ville": "ville"',
                id: 'user-message',
            },
            {
                role: 'assistant',
                text: 'Merci jai bien reçu le dictionnaire de la table tbl_incidents',
                id: 'assistant-message',
            },
            {
                role: 'user',
                text: 'voici le dictionnaire pour la table tbl_vehicule: "id": "identifiant du véhicule", "balise_gps_id": "identifiant de la balise GPS", "vehicule_code_viper": "code Viper du véhicule", "maj_gps_position": "mise à jour de la position GPS", "nom": "nom du véhicule", "imei": "IMEI", "vin": "VIN", "marque": "marque du véhicule", "type": "type du véhicule", "couleur": "couleur du véhicule", "climatisation": "indication de la climatisation", "nbre_places": "nombre de places", "derniere_position": "dernière position", "latitude": "latitude", "longitude": "longitude", "lastValidLatitude": "dernière latitude valide", "lastValidLongitude": "dernière longitude valide", "latest_positions": "dernières positions", "disponible": "disponible", "date_disponible": "date de disponibilité", "photo": "photo", "type_carburant": "type de carburant", "fabricant": "fabricant", "num_serie": "numéro de série", "localisation": "localisation", "date_circulation": "date de circulation", "position_actuelle": "position actuelle", "model": "modèle du véhicule", "adresse_street": "adresse (rue)", "adresse_streetNumber": "adresse (numéro de rue)", "adresse_zipCode": "adresse (code postal)", "adresse_city": "adresse (ville)", "adresse_locality": "adresse (localité)", "adresse_country": "adresse (pays)", "status": "statut", "driverId": "identifiant du conducteur", "driver": "conducteur", "driver_updated_at": "date de mise à jour du conducteur", "driver_created_at": "date de création du conducteur", "driver_email": "e-mail du conducteur", "driver_description": "description du conducteur", "driver_phone": "téléphone du conducteur", "iconColour": "couleur de l\'icône", "speed": "vitesse", "plateNumber": "numéro de plaque d\'immatriculation", "active": "actif", "fuelCapacity": "capacité du réservoir de carburant", "drivingTime": "temps de conduite", "colour": "couleur", "volumeCapacity": "capacité du volume", "vehicleRef": "référence du véhicule", "usageStop": "arrêt d\'utilisation", "usageStart": "début d\'utilisation", "motor": "moteur", "iconName": "nom de l\'icône", "buyDate": "date d\'achat", "batteryVoltage": "tension de la batterie", "deviceType": "type de dispositif", "brand": "marque", "brandId": "identifiant de la marque", "modelId": "identifiant du modèle", "urbanFuelConsumption": "consommation urbaine de carburant", "totalDistance": "distance totale", "totalDistance_ini": "distance totale initiale", "lasttotlaDistance": "dernière distance totale", "lastKilometrage": "dernier kilométrage", "direction": "direction", "lastUpdateTime": "dernière mise à jour", "proprietaire_id": "identifiant du propriétaire", "description": "description", "confort": "confort", "modele": "modèle", "vehicule_alert_status": "statut d\'alerte du véhicule", "date_depart": "date de départ", "date_restitution": "date de restitution", "restituer": "restituer", "id_user_reserver": "identifiant de l\'utilisateur réservant", "site_station": "site / station", "type_vehicule": "type de véhicule", "dernier_conducteur": "dernier conducteur", "dernier_conducteur_date_reservation": "date de réservation du dernier conducteur", "assurance": "assurance", "permis_suspendu": "permis suspendu", "type_permis": "type de permis", "permis_accompagne": "permis accompagné", "car_mileage": "kilométrage du véhicule", "annee_cir": "année de mise en circulation", "mois_cir": "mois de mise en circulation", "puissance": "puissance", "jour_cir": "jour de mise en circulation", "propriete": "propriété", "vehicule_assurer_digitrans": "assuré par Digitrans", "vehicule_assurer_digitrans_by": "assuré par Digitrans (par)", "total_view": "total des vues", "entreprise_id": "identifiant de l\'entreprise", "boite_auto": "boîte automatique", "photo_confirmed": "photo confirmée", "prochain_ct": "prochain contrôle technique", "prochaine_revision": "prochaine révision", "date_prochaine_revision": "date de la prochaine révision", "group": "groupe", "group_id": "identifiant du groupe", "notes": "notes", "type_engin": "type d\'engin", "course": "cours", "acktimestamp": "horodatage de l\'accusé de réception", "timestamp": "horodatage", "time": "temps", "online": "en ligne", "altitude": "altitude", "object_owner": "propriétaire de l\'objet", "sim_number": "numéro de carte SIM", "fuel_per_km": "consommation de carburant par kilomètre", "fuel_per_100": "consommation de carburant pour 100 kilomètres", "fuel_price": "prix du carburant", "fuel_quantity": "quantité de carburant", "fuelCapacityActu": "capacité actuelle du réservoir de carburant", "etat": "état", "genre": "genre", "categorie_vehicule_id": "identifiant de la catégorie du véhicule", "num_chassis": "numéro de châssis", "num_moteur": "numéro de moteur", "poids": "poids", "date_fab": "date de fabrication", "dim_pneus": "dimensions des pneus", "volant": "volant", "cylindre": "cylindre", "conducteur": "conducteur", "periode_debut_conducteur": "période de début du conducteur", "periode_fin_conducteur": "période de fin du conducteur", "active_conducteur": "conducteur actif", "affected_to": "affecté à", "debut_affected": "début de l\'affectation", "fin_affected": "fin de l\'affectation", "active_autopartage": "autopartage actif", "cout_possession": "coût de possession", "last_kilometrage_save": "dernière sauvegarde du kilométrage", "agrement_id": "identifiant de l\'agrément", "agrement_etat": "état de l\'agrément", "acquisition": "acquisition", "prix_acquisition": "prix d\'acquisition", "model_device": "modèle de dispositif", "last_date_fuel": "dernière date de carburant", "alert_send_carburant": "alerte d\'envoi de carburant", "ammortissement_id": "identifiant d\'amortissement", "inputs": "entrées", "cap": "cap", "mileage_g": "kilométrage G", "mileage_t": "kilométrage T", "mileage": "kilométrage", "create_device_gpswox": "créer un dispositif GPSWOX", "last_add_device_data": "dernière ajout des données du dispositif", "distance_parcourue_auj": "distance parcourue aujourd\'hui", "fuel_consumption_auj": "consommation de carburant aujourd\'hui", "gestion": "gestion", "img_ext": "image extérieure", "img_int": "image intérieure", "cg_recto": "carte grise (recto)", "cg_verso": "carte grise (verso)", "direction_id": "identifiant de la direction", "nomcoffret": "nom du coffret", "idkey_in_coffret": "identifiant de la clé dans le coffret", "id_cle": "identifiant de la clé", "keyState": "état de la clé", "bache": "bâche", "caisse": "caisse", "img_bache": "image de la bâche", "img_caisse": "image de la caisse", "doc_caisse": "document de la caisse", "doc_bache": "document de la bâche", "renouvellement": "renouvellement", "alert_send_renouvellement": "alerte d\'envoi de renouvellement", "charge_utile": "charge utile", "lld": "LLD", "prix_cession": "prix de cession", "val_dep": "valeur dépréciée", "date_cir": "date de mise en circulation", "date_acq": "date d\'acquisition", "generate_first_visite": "générer la première visite", "balise_marque": "marque de la balise", "balise_model": "modèle de la balise", "anti_demarrage": "anti-démarrage", "anti_relai_installe": "relais installé", "envoi_notif_block_vehicule": "envoi de notification de blocage du véhicule", "envoi_notif_de_block_vehicule": "envoi de notification de déblocage du véhicule", "mouvement": "mouvement", "demarrage": "démarrage", "lancement_anti_demarrage": "lancement de l\'anti-démarrage", "bloc_vehicule_sans_reservation": "véhicule bloqué sans réservation", "gestionnaire_desactive_relai": "gestionnaire désactive le relai", "stop_duration": "durée d\'arrêt", "ibutton_id": "identifiant iButton", "last_kilometrage_save_value": "dernière valeur sauvegardée du kilométrage", "engine_hours": "heures du moteur", "stop_duration_seconde": "durée d\'arrêt (secondes)", "personne": "personne", "last_rpm": "dernier RPM", "affectation_id": "identifiant de l\'affectation", "alert_sans_reservation": "alerte sans réservation", "isconnected": "connecté", "gps_fixe": "GPS fixe", "choix_vehicule_affectation": "choix du véhicule pour l\'affectation", "latest_speed": "dernière vitesse", "zone_in": "zone entrante", "moto": "moto", "driver_rfid": "RFID du conducteur", "private": "privé", "update_device_gpswox": "mettre à jour le dispositif GPSWOX", "old_plate_number": "ancien numéro de plaque"',
                id: 'user-message',
            },
            {
                role: 'assistant',
                text: 'Merci jai bien reçu le dictionnaire de la table tbl_vehicule',
                id: 'assistant-message',
            },
            {
                role: 'user',
                text: 'voici le dictionnaire pour la table tbl_vehicule: "id": "identifiant du véhicule", "balise_gps_id": "identifiant de la balise GPS", "vehicule_code_viper": "code Viper du véhicule", "maj_gps_position": "mise à jour de la position GPS", "nom": "nom du véhicule", "imei": "IMEI", "vin": "VIN", "marque": "marque du véhicule", "type": "type du véhicule", "couleur": "couleur du véhicule", "climatisation": "indication de la climatisation", "nbre_places": "nombre de places", "derniere_position": "dernière position", "latitude": "latitude", "longitude": "longitude", "lastValidLatitude": "dernière latitude valide", "lastValidLongitude": "dernière longitude valide", "latest_positions": "dernières positions", "disponible": "disponible", "date_disponible": "date de disponibilité", "photo": "photo", "type_carburant": "type de carburant", "fabricant": "fabricant", "num_serie": "numéro de série", "localisation": "localisation", "date_circulation": "date de circulation", "position_actuelle": "position actuelle", "model": "modèle du véhicule", "adresse_street": "adresse (rue)", "adresse_streetNumber": "adresse (numéro de rue)", "adresse_zipCode": "adresse (code postal)", "adresse_city": "adresse (ville)", "adresse_locality": "adresse (localité)", "adresse_country": "adresse (pays)", "status": "statut", "driverId": "identifiant du conducteur", "driver": "conducteur", "driver_updated_at": "date de mise à jour du conducteur", "driver_created_at": "date de création du conducteur", "driver_email": "e-mail du conducteur", "driver_description": "description du conducteur", "driver_phone": "téléphone du conducteur", "iconColour": "couleur de l\'icône", "speed": "vitesse", "plateNumber": "numéro de plaque d\'immatriculation", "active": "actif", "fuelCapacity": "capacité du réservoir de carburant", "drivingTime": "temps de conduite", "colour": "couleur", "volumeCapacity": "capacité du volume", "vehicleRef": "référence du véhicule", "usageStop": "arrêt d\'utilisation", "usageStart": "début d\'utilisation", "motor": "moteur", "iconName": "nom de l\'icône", "buyDate": "date d\'achat", "batteryVoltage": "tension de la batterie", "deviceType": "type de dispositif", "brand": "marque", "brandId": "identifiant de la marque", "modelId": "identifiant du modèle", "urbanFuelConsumption": "consommation urbaine de carburant", "totalDistance": "distance totale", "totalDistance_ini": "distance totale initiale", "lasttotlaDistance": "dernière distance totale", "lastKilometrage": "dernier kilométrage", "direction": "direction", "lastUpdateTime": "dernière mise à jour", "proprietaire_id": "identifiant du propriétaire", "description": "description", "confort": "confort", "modele": "modèle", "vehicule_alert_status": "statut d\'alerte du véhicule", "date_depart": "date de départ", "date_restitution": "date de restitution", "restituer": "restituer", "id_user_reserver": "identifiant de l\'utilisateur réservant", "site_station": "site / station", "type_vehicule": "type de véhicule", "dernier_conducteur": "dernier conducteur", "dernier_conducteur_date_reservation": "date de réservation du dernier conducteur", "assurance": "assurance", "permis_suspendu": "permis suspendu", "type_permis": "type de permis", "permis_accompagne": "permis accompagné", "car_mileage": "kilométrage du véhicule", "annee_cir": "année de mise en circulation", "mois_cir": "mois de mise en circulation", "puissance": "puissance", "jour_cir": "jour de mise en circulation", "propriete": "propriété", "vehicule_assurer_digitrans": "assuré par Digitrans", "vehicule_assurer_digitrans_by": "assuré par Digitrans (par)", "total_view": "total des vues", "entreprise_id": "identifiant de l\'entreprise", "boite_auto": "boîte automatique", "photo_confirmed": "photo confirmée", "prochain_ct": "prochain contrôle technique", "prochaine_revision": "prochaine révision", "date_prochaine_revision": "date de la prochaine révision", "group": "groupe", "group_id": "identifiant du groupe", "notes": "notes", "type_engin": "type d\'engin", "course": "cours", "acktimestamp": "horodatage de l\'accusé de réception", "timestamp": "horodatage", "time": "temps", "online": "en ligne", "altitude": "altitude", "object_owner": "propriétaire de l\'objet", "sim_number": "numéro de carte SIM", "fuel_per_km": "consommation de carburant par kilomètre", "fuel_per_100": "consommation de carburant pour 100 kilomètres", "fuel_price": "prix du carburant", "fuel_quantity": "quantité de carburant", "fuelCapacityActu": "capacité actuelle du réservoir de carburant", "etat": "état", "genre": "genre", "categorie_vehicule_id": "identifiant de la catégorie du véhicule", "num_chassis": "numéro de châssis", "num_moteur": "numéro de moteur", "poids": "poids", "date_fab": "date de fabrication", "dim_pneus": "dimensions des pneus", "volant": "volant", "cylindre": "cylindre", "conducteur": "conducteur", "periode_debut_conducteur": "période de début du conducteur", "periode_fin_conducteur": "période de fin du conducteur", "active_conducteur": "conducteur actif", "affected_to": "affecté à", "debut_affected": "début de l\'affectation", "fin_affected": "fin de l\'affectation", "active_autopartage": "autopartage actif", "cout_possession": "coût de possession", "last_kilometrage_save": "dernière sauvegarde du kilométrage", "agrement_id": "identifiant de l\'agrément", "agrement_etat": "état de l\'agrément", "acquisition": "acquisition", "prix_acquisition": "prix d\'acquisition", "model_device": "modèle de dispositif", "last_date_fuel": "dernière date de carburant", "alert_send_carburant": "alerte d\'envoi de carburant", "ammortissement_id": "identifiant d\'amortissement", "inputs": "entrées", "cap": "cap", "mileage_g": "kilométrage G", "mileage_t": "kilométrage T", "mileage": "kilométrage", "create_device_gpswox": "créer un dispositif GPSWOX", "last_add_device_data": "dernière ajout des données du dispositif", "distance_parcourue_auj": "distance parcourue aujourd\'hui", "fuel_consumption_auj": "consommation de carburant aujourd\'hui", "gestion": "gestion", "img_ext": "image extérieure", "img_int": "image intérieure", "cg_recto": "carte grise (recto)", "cg_verso": "carte grise (verso)", "direction_id": "identifiant de la direction", "nomcoffret": "nom du coffret", "idkey_in_coffret": "identifiant de la clé dans le coffret", "id_cle": "identifiant de la clé", "keyState": "état de la clé", "bache": "bâche", "caisse": "caisse", "img_bache": "image de la bâche", "img_caisse": "image de la caisse", "doc_caisse": "document de la caisse", "doc_bache": "document de la bâche", "renouvellement": "renouvellement", "alert_send_renouvellement": "alerte d\'envoi de renouvellement", "charge_utile": "charge utile", "lld": "LLD", "prix_cession": "prix de cession", "val_dep": "valeur dépréciée", "date_cir": "date de mise en circulation", "date_acq": "date d\'acquisition", "generate_first_visite": "générer la première visite", "balise_marque": "marque de la balise", "balise_model": "modèle de la balise", "anti_demarrage": "anti-démarrage", "anti_relai_installe": "relais installé", "envoi_notif_block_vehicule": "envoi de notification de blocage du véhicule", "envoi_notif_de_block_vehicule": "envoi de notification de déblocage du véhicule", "mouvement": "mouvement", "demarrage": "démarrage", "lancement_anti_demarrage": "lancement de l\'anti-démarrage", "bloc_vehicule_sans_reservation": "véhicule bloqué sans réservation", "gestionnaire_desactive_relai": "gestionnaire désactive le relai", "stop_duration": "durée d\'arrêt", "ibutton_id": "identifiant iButton", "last_kilometrage_save_value": "dernière valeur sauvegardée du kilométrage", "engine_hours": "heures du moteur", "stop_duration_seconde": "durée d\'arrêt (secondes)", "personne": "personne", "last_rpm": "dernier RPM", "affectation_id": "identifiant de l\'affectation", "alert_sans_reservation": "alerte sans réservation", "isconnected": "connecté", "gps_fixe": "GPS fixe", "choix_vehicule_affectation": "choix du véhicule pour l\'affectation", "latest_speed": "dernière vitesse", "zone_in": "zone entrante", "moto": "moto", "driver_rfid": "RFID du conducteur", "private": "privé", "update_device_gpswox": "mettre à jour le dispositif GPSWOX", "old_plate_number": "ancien numéro de plaque"',
                id: 'user-message',
            },
            {
                role: 'assistant',
                text: 'Merci jai bien reçu le dictionnaire de la table tbl_vehicule',
                id: 'assistant-message',
            },
            {
                role: 'user',
                text: 'voici le schema de la table tbl_reservation \'tbl_reservation\', \'CREATE TABLE `tbl_reservation` (\n  `id` int(11) NOT NULL AUTO_INCREMENT,\n  `user_id` int(11) NOT NULL,\n  `date_reservation` datetime DEFAULT NULL,\n  `statut` int(11) DEFAULT 0,\n  `depart` varchar(200) DEFAULT NULL,\n  `arrive` varchar(200) DEFAULT NULL,\n  `motif` text DEFAULT NULL,\n  `autre_motif` text DEFAULT NULL,\n  `vehicule_id` int(11) DEFAULT NULL,\n  `date_depart` date DEFAULT NULL,\n  `date_retour` date DEFAULT NULL,\n  `etat` int(1) NOT NULL DEFAULT 1 COMMENT \'1:en cours, 2:terminé, 3:annulé\',\n  `date_debut` datetime DEFAULT NULL,\n  `heure_debut` varchar(10) DEFAULT NULL,\n  `heure_retour` varchar(10) DEFAULT NULL,\n  `note_attribue` int(11) DEFAULT NULL,\n  `date_fin` datetime DEFAULT NULL,\n  `detailtrajet` text DEFAULT NULL,\n  `infotrajet` varchar(200) DEFAULT NULL,\n  `reservation_alert_status` int(11) NOT NULL DEFAULT 1,\n  `alerts_covoiturage_status` int(11) NOT NULL DEFAULT 1,\n  `distancetrajet` varchar(50) DEFAULT NULL,\n  `distancetrajet_km` float DEFAULT NULL,\n  `dureetrajet` varchar(50) DEFAULT NULL,\n  `raisonannulation` text DEFAULT NULL,\n  `raisonsprolonger` text DEFAULT NULL,\n  `date_cloture` datetime DEFAULT NULL,\n  `reservation_alert_time` varchar(200) DEFAULT NULL,\n  `etatlieuxvehicule` text DEFAULT NULL,\n  `date_etatlieuxvehicule` datetime DEFAULT NULL,\n  `entreprise_id` int(11) DEFAULT NULL,\n  `reservation_alert_depart` int(11) NOT NULL DEFAULT 0,\n  `reservation_alert_restitue` int(11) DEFAULT 0,\n  `id_cov` int(11) DEFAULT NULL,\n  `kilometrage_parcourue` float DEFAULT NULL,\n  `active` int(11) DEFAULT 1,\n  `coordinates` text DEFAULT NULL,\n  `name_geofence` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,\n  `id_geofence` int(11) DEFAULT NULL,\n  `id_alert` int(11) DEFAULT NULL,\n  `dotation` float DEFAULT NULL,\n  `qte_litre_cons` float DEFAULT NULL,\n  `dotation_reel` float DEFAULT NULL,\n  `ecart_dotation` float DEFAULT NULL,\n  `ecart_dotation_pourcentage` float DEFAULT NULL,\n  `distance_parcourue` float DEFAULT NULL,\n  `active_alert` int(11) DEFAULT NULL,\n  `kilometrage_debut` float DEFAULT NULL,\n  `kilometrage_fin` float DEFAULT NULL,\n  `dotation_carburant` float DEFAULT NULL,\n  `engine_hours` varchar(45) DEFAULT NULL,\n  `engine_idle` varchar(45) DEFAULT NULL,\n  `engine_work` varchar(45) DEFAULT NULL,\n  `drivers` varchar(145) DEFAULT NULL,\n  `duration` varchar(45) DEFAULT NULL,\n  `speed_max` varchar(45) DEFAULT NULL,\n  `speed_min` varchar(45) DEFAULT NULL,\n  `speed_avg` varchar(45) DEFAULT NULL,\n  `experience` text DEFAULT NULL,\n  `objets_trouves` text DEFAULT NULL,\n  `etat_lieu_apres_affectation` text DEFAULT NULL,\n  `date_etat_lieu_restitution` text DEFAULT NULL,\n  `comment` text DEFAULT NULL,\n  `date_fin_prevue` datetime DEFAULT NULL,\n  `depart_lat` double DEFAULT NULL,\n  `depart_lng` double DEFAULT NULL,\n  `arrive_lat` double DEFAULT NULL,\n  `arrive_lng` double DEFAULT NULL,\n  `date_demande` datetime DEFAULT NULL,\n  `conducteur_id` int(11) DEFAULT NULL,\n  `with_notif` int(11) DEFAULT NULL,\n  `date_action` datetime DEFAULT NULL,\n  `remarques` text DEFAULT NULL,\n  `id_cle` int(11) DEFAULT NULL,\n  `statut_cle` int(11) DEFAULT NULL,\n  `code_ouverture_coffret` varchar(5) DEFAULT NULL,\n  `etape1` varchar(200) DEFAULT NULL,\n  `etape1_lat` double DEFAULT NULL,\n  `etape1_lng` double DEFAULT NULL,\n  `etape2` varchar(200) DEFAULT NULL,\n  `etape2_lat` double DEFAULT NULL,\n  `etape2_lng` double DEFAULT NULL,\n  `etape3` varchar(200) DEFAULT NULL,\n  `etape3_lat` double DEFAULT NULL,\n  `etape3_lng` double DEFAULT NULL,\n  `etape4` varchar(200) DEFAULT NULL,\n  `etape4_lat` double DEFAULT NULL,\n  `etape4_lng` double DEFAULT NULL,\n  `etape5` varchar(200) DEFAULT NULL,\n  `etape5_lat` double DEFAULT NULL,\n  `etape5_lng` double DEFAULT NULL,\n  `etape6` varchar(200) DEFAULT NULL,\n  `etape6_lat` double DEFAULT NULL,\n  `etape6_lng` double DEFAULT NULL,\n  `cloture_by_gestionnaire` int(11) DEFAULT 0,\n  `id_histo_cond` int(11) DEFAULT NULL,\n  `user_driver_id` int(11) DEFAULT NULL,\n  `distance_parcourue_total` float DEFAULT NULL,\n  `distance_conduite` float DEFAULT NULL,\n  `overspeed_duration` varchar(45) DEFAULT NULL,\n  `overspeed_distance` varchar(45) DEFAULT NULL,\n  `stop_duration` varchar(45) DEFAULT NULL,\n  `stop_count` int(11) DEFAULT NULL,\n  `drive_duration` varchar(45) DEFAULT NULL,\n  `date_current_driver` datetime DEFAULT NULL,\n  `etat_label` varchar(45) DEFAULT NULL,\n  `etat_lieu_id` int(11) DEFAULT NULL,\n  `nbre_survitesse` int(11) DEFAULT 0,\n  `nbre_acc_brusque` int(11) DEFAULT 0,\n  `nbre_freinage_brusque` int(11) DEFAULT NULL,\n  `nbre_moteur_au_ralenti` int(11) DEFAULT 0,\n  `nbre_rpm_inadapte` int(11) DEFAULT 0,\n  `nbre_virage_brusque` int(11) DEFAULT 0,\n  `nbre_fatigue_volant` int(11) DEFAULT 0,\n  `heure_moteur_fin` double DEFAULT 0,\n  `heure_moteur_debut` double DEFAULT 0,\n  `heure_moteur` double DEFAULT 0,\n  `auto` int(11) DEFAULT 0,\n  PRIMARY KEY (`id`),\n  KEY `vehicule_id` (`vehicule_id`),\n  KEY `user_id` (`user_id`),\n  KEY `active` (`active`),\n  KEY `entreprise_id` (`entreprise_id`),\n  KEY `date_reservation` (`date_reservation`),\n  KEY `date_depart` (`date_debut`)\n) ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci\'',
                id: 'user-message',
            },
            {
                role: 'assistant',
                text: 'Merci jai bien reçu le schemas de la table tbl_reservation',
                id: 'assistant-message',
            },
            {
                role: 'user',
                text: 'voici le schema de la table tbl_reservation "id": "identifiant de la réservation", "user_id": "identifiant de l\'utilisateur qui a effectué la réservation", "date_reservation": "date et heure de la réservation", "statut": "statut actuel de la réservation(en cours, terminée, annulée, etc.) ", "depart": "lieu de départ de la réservation", "arrive": "lieu d\'arrivée de la réservation", "motif": "motif de la réservation", "autre_motif": "motif supplémentaire de la réservation (si applicable)", "vehicule_id": "identifiant du véhicule réservé", "date_depart": "date de début de la réservation", "date_retour": "date de retour prévue de la réservation", "etat": "état de la réservation (validé, en attente, etc.)", "date_debut": "date et heure de début réelle de la réservation", "heure_debut": "heure de début réelle de la réservation", "heure_retour": "heure de retour réelle de la réservation", "note_attribue": "note attribuée à la réservation", "date_fin": "date et heure de fin réelle de la réservation", "detailtrajet": "détails du trajet prévu", "infotrajet": "informations supplémentaires sur le trajet", "reservation_alert_status": "statut des alertes liées à la réservation", "alerts_covoiturage_status": "statut des alertes de covoiturage", "distancetrajet": "distance totale du trajet", "distancetrajet_km": "distance totale du trajet en kilomètres", "dureetrajet": "durée totale du trajet", "raisonannulation": "raison de l\'annulation de la réservation", "raisonsprolonger": "raisons pour prolonger la réservation", "date_cloture": "date et heure de clôture de la réservation", "reservation_alert_time": "date et heure de l\'alerte de réservation", "etatlieuxvehicule": "état du véhicule lors de la réservation", "date_etatlieuxvehicule": "date et heure de l\'état du véhicule", "entreprise_id": "identifiant de l\'entreprise liée à la réservation", "reservation_alert_depart": "alerte de départ activée ou désactivée", "reservation_alert_restitue": "alerte de restitution activée ou désactivée", "id_cov": "identifiant du covoiturage (si applicable)", "kilometrage_parcourue": "kilométrage parcouru lors de la réservation", "active": "statut d\'activation de la réservation", "coordinates": "coordonnées géographiques de la réservation", "name_geofence": "nom de la géo- clôture associée à la réservation", "id_geofence": "identifiant de la géo - clôture associée à la réservation", "id_alert": "identifiant de l\'alerte associée à la réservation", "dotation": "dotation prévue pour la réservation", "qte_litre_cons": "quantité de carburant consommée en litres", "dotation_reel": "dotation réelle utilisée pour la réservation", "ecart_dotation": "écart entre la dotation prévue et réelle", "ecart_dotation_pourcentage": "écart entre la dotation prévue et réelle en pourcentage", "distance_parcourue": "distance totale parcourue lors de la réservation", "active_alert": "statut d\'activation des alertes", "kilometrage_debut": "kilométrage du véhicule au début de la réservation", "kilometrage_fin": "kilométrage du véhicule à la fin de la réservation", "dotation_carburant": "dotation en carburant pour la réservation", "engine_hours": "heures de fonctionnement du moteur du véhicule", "engine_idle": "temps de ralenti du moteur du véhicule", "engine_work": "temps de fonctionnement du moteur en travail", "drivers": "conducteurs associés à la réservation", "duration": "durée totale de la réservation", "speed_max": "vitesse maximale atteinte lors de la réservation", "speed_min": "vitesse minimale atteinte lors de la réservation", "speed_avg": "vitesse moyenne atteinte lors de la réservation", "experience": "expérience de conduite lors de la réservation", "objets_trouves": "objets trouvés lors de la réservation", "etat_lieu_apres_affectation": "état du véhicule après l\'affectation", "date_etat_lieu_restitution": "date et heure de l\'état du véhicule après restitution", "comment": "commentaires associés à la réservation", "date_fin_prevue": "date et heure de fin prévue de la réservation", "depart_lat": "latitude du lieu de départ", "depart_lng": "longitude du lieu de départ", "arrive_lat": "latitude du lieu d\'arrivée", "arrive_lng": "longitude du lieu d\'arrivée", "date_demande": "date et heure de la demande de réservation", "conducteur_id": "identifiant du conducteur associé à la réservation", "with_notif": "indique si des notifications sont activées", "date_action": "date et heure de l\'action associée à la réservation", "remarques": "remarques supplémentaires sur la réservation", "id_cle": "identifiant de la clé associée à la réservation", "statut_cle": "statut de la clé (disponible, utilisée, etc.)", "code_ouverture_coffret": "code d\'ouverture du coffret(si applicable)", "etape1": "première étape du trajet", "etape1_lat": "latitude de la première étape", "etape1_lng": "longitude de la première étape", "etape2": "deuxième étape du trajet", "etape2_lat": "latitude de la deuxième étape", "etape2_lng": "longitude de la deuxième étape", "etape3": "troisième étape du trajet", "etape3_lat": "latitude de la troisième étape", "etape3_lng": "longitude de la troisième étape", "etape4": "quatrième étape du trajet", "etape4_lat": "latitude de la quatrième étape", "etape4_lng": "longitude de la quatrième étape", "etape5": "cinquième étape du trajet", "etape5_lat": "latitude de la cinquième étape", "etape5_lng": "longitude de la cinquième étape", "etape6": "sixième étape du trajet", "etape6_lat": "latitude de la sixième étape", "etape6_lng": "longitude de la sixième étape", "cloture_by_gestionnaire": "nom du gestionnaire ayant clôturé la réservation", "id_histo_cond": "identifiant de l\'historique du conducteur", "user_driver_id": "identifiant du conducteur utilisateur", "distance_parcourue_total": "distance totale parcourue par le conducteur", "distance_conduite": "distance totale de conduite par le conducteur", "overspeed_duration": "durée de survitesse du conducteur", "overspeed_distance": "distance de survitesse du conducteur", "stop_duration": "durée totale d\'arrêt du conducteur", "stop_count": "nombre total d\'arrêts du conducteur", "drive_duration": "durée totale de conduite du conducteur", "date_current_driver": "date et heure du conducteur actuel", "etat_label": "étiquette d\'état associée à la réservation", "etat_lieu_id": "identifiant de l\'état du lieu associé à la réservation", "nbre_survitesse": "nombre d\'incidents de survitesse", "nbre_acc_brusque": "nombre d\'incidents d\'accélération brusque", "nbre_freinage_brusque": "nombre d\'incidents de freinage brusque", "nbre_moteur_au_ralenti": "nombre d\'incidents de moteur au ralenti", "nbre_rpm_inadapte": "nombre d\'incidents de RPM inadapté", "nbre_virage_brusque": "nombre d\'incidents de virage brusque", "nbre_fatigue_volant": "nombre d\'incidents de fatigue au volant", "heure_moteur_fin": "heure de fin du moteur", "heure_moteur_debut": "heure de début du moteur", "heure_moteur": "heure de fonctionnement du moteur", "auto": "indicateur de caractéristique automatique"',
                id: 'user-message',
            },
            {
                role: 'assistant',
                text: 'Merci jai bien reçu le schemas de la table tbl_reservation',
                id: 'assistant-message',
            },
            {
                role: 'user',
                text: '\'voici le schema de la table tbl_vehicule\'tbl_vehicule\', \'CREATE TABLE `tbl_vehicule`(\n`id` int(11) NOT NULL AUTO_INCREMENT, \n`balise_gps_id` varchar(50) DEFAULT NULL, \n`vehicule_code_viper` varchar(200) DEFAULT NULL, \n`maj_gps_position` datetime DEFAULT NULL, \n`nom` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL, \n`imei` varchar(145) DEFAULT NULL, \n`vin` varchar(145) DEFAULT NULL, \n`marque` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL, \n`type` varchar(50) DEFAULT NULL, \n`couleur` varchar(50) DEFAULT NULL, \n`climatisation` varchar(3) NOT NULL DEFAULT \'0\',\n  `nbre_places` int(11) DEFAULT 5,\n  `derniere_position` varchar(100) DEFAULT NULL,\n  `latitude` double DEFAULT NULL,\n  `longitude` double DEFAULT NULL,\n  `lastValidLatitude` double DEFAULT NULL,\n  `lastValidLongitude` double DEFAULT NULL,\n  `latest_positions` text DEFAULT NULL,\n  `disponible` int(11) NOT NULL DEFAULT 1,\n  `date_disponible` datetime DEFAULT NULL,\n  `photo` varchar(50) DEFAULT NULL,\n  `type_carburant` varchar(100) DEFAULT NULL,\n  `fabricant` varchar(200) DEFAULT NULL,\n  `num_serie` varchar(100) DEFAULT NULL,\n  `localisation` varchar(100) DEFAULT NULL,\n  `date_circulation` date DEFAULT NULL,\n  `position_actuelle` varchar(100) DEFAULT NULL,\n  `model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,\n  `adresse_street` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,\n  `adresse_streetNumber` varchar(100) DEFAULT NULL,\n  `adresse_zipCode` varchar(100) DEFAULT NULL,\n  `adresse_city` varchar(100) DEFAULT NULL,\n  `adresse_locality` varchar(150) DEFAULT NULL,\n  `adresse_country` varchar(100) DEFAULT NULL,\n  `status` int(11) DEFAULT NULL,\n  `driverId` int(11) DEFAULT NULL,\n  `driver` varchar(145) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,\n  `driver_updated_at` datetime DEFAULT NULL,\n  `driver_created_at` datetime DEFAULT NULL,\n  `driver_email` varchar(45) DEFAULT NULL,\n  `driver_description` varchar(145) DEFAULT NULL,\n  `driver_phone` varchar(45) DEFAULT NULL,\n  `iconColour` int(11) DEFAULT NULL,\n  `speed` int(11) DEFAULT NULL,\n  `plateNumber` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,\n  `active` tinyint(1) DEFAULT 0,\n  `fuelCapacity` float(12,0) DEFAULT NULL,\n  `drivingTime` int(11) DEFAULT NULL,\n  `colour` varchar(50) DEFAULT NULL,\n  `volumeCapacity` int(11) DEFAULT NULL,\n  `vehicleRef` varchar(100) DEFAULT NULL,\n  `usageStop` varchar(100) DEFAULT NULL,\n  `usageStart` varchar(50) DEFAULT NULL,\n  `motor` varchar(100) DEFAULT NULL,\n  `iconName` varchar(100) DEFAULT NULL,\n  `buyDate` varchar(50) DEFAULT NULL,\n  `batteryVoltage` float(12,0) DEFAULT NULL,\n  `deviceType` varchar(50) DEFAULT NULL,\n  `brand` varchar(50) DEFAULT NULL,\n  `brandId` int(11) DEFAULT NULL,\n  `modelId` int(11) DEFAULT NULL,\n  `urbanFuelConsumption` float DEFAULT NULL,\n  `totalDistance` float DEFAULT NULL,\n  `totalDistance_ini` float DEFAULT NULL,\n  `lasttotlaDistance` float DEFAULT NULL,\n  `lastKilometrage` float DEFAULT NULL,\n  `direction` int(11) DEFAULT NULL,\n  `lastUpdateTime` varchar(50) DEFAULT NULL,\n  `proprietaire_id` int(11) DEFAULT NULL,\n  `description` text DEFAULT NULL,\n  `confort` varchar(100) DEFAULT NULL,\n  `modele` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,\n  `vehicule_alert_status` int(11) DEFAULT 1,\n  `date_depart` datetime DEFAULT NULL,\n  `date_restitution` datetime DEFAULT NULL,\n  `restituer` int(11) DEFAULT 0,\n  `id_user_reserver` int(11) DEFAULT 0,\n  `site_station` int(11) DEFAULT NULL,\n  `type_vehicule` varchar(50) DEFAULT NULL,\n  `dernier_conducteur` int(11) DEFAULT NULL,\n  `dernier_conducteur_date_reservation` datetime DEFAULT NULL,\n  `assurance` int(11) DEFAULT NULL,\n  `permis_suspendu` varchar(20) DEFAULT NULL,\n  `type_permis` varchar(6) DEFAULT NULL,\n  `permis_accompagne` int(11) DEFAULT 0,\n  `car_mileage` varchar(20) DEFAULT NULL,\n  `annee_cir` int(4) DEFAULT NULL,\n  `mois_cir` varchar(2) DEFAULT NULL,\n  `puissance` varchar(25) DEFAULT NULL,\n  `jour_cir` varchar(2) DEFAULT NULL,\n  `propriete` varchar(20) DEFAULT NULL,\n  `vehicule_assurer_digitrans` int(11) NOT NULL DEFAULT 0,\n  `vehicule_assurer_digitrans_by` varchar(30) DEFAULT NULL,\n  `total_view` int(11) DEFAULT NULL,\n  `entreprise_id` int(11) DEFAULT NULL,\n  `boite_auto` int(11) NOT NULL DEFAULT 0,\n  `photo_confirmed` int(11) NOT NULL DEFAULT 0,\n  `prochain_ct` date DEFAULT NULL,\n  `prochaine_revision` varchar(45) DEFAULT \'3000\' COMMENT \'Kilométrage auquel il faudra efectuer la prochaine révision du véhicule\',\n  `date_prochaine_revision` date DEFAULT NULL,\n  `group` varchar(155) DEFAULT NULL,\n  `group_id` varchar(45) DEFAULT NULL,\n  `notes` text DEFAULT NULL COMMENT \'0 : Voiture\\n1 : Moto\\n2 : Camion\',\n  `type_engin` int(11) DEFAULT 0,\n  `course` int(11) DEFAULT NULL,\n  `acktimestamp` int(11) DEFAULT NULL,\n  `timestamp` int(11) DEFAULT NULL,\n  `time` varchar(45) DEFAULT NULL,\n  `online` varchar(45) DEFAULT NULL,\n  `altitude` int(11) DEFAULT NULL,\n  `object_owner` varchar(145) DEFAULT NULL,\n  `sim_number` varchar(45) DEFAULT NULL,\n  `fuel_per_km` varchar(45) DEFAULT NULL,\n  `fuel_per_100` varchar(45) DEFAULT NULL,\n  `fuel_price` varchar(45) DEFAULT NULL,\n  `fuel_quantity` varchar(45) DEFAULT NULL,\n  `fuelCapacityActu` float DEFAULT NULL,\n  `etat` int(11) DEFAULT 1 COMMENT \'0: inactif, 1:actif, 2:en maintenance, 3:hors service\',\n  `genre` int(11) DEFAULT 1 COMMENT \'1 : véhicule , 2 : moto\',\n  `categorie_vehicule_id` int(11) DEFAULT NULL,\n  `num_chassis` varchar(50) DEFAULT NULL,\n  `num_moteur` varchar(45) DEFAULT NULL,\n  `poids` varchar(45) DEFAULT NULL,\n  `date_fab` varchar(45) DEFAULT NULL,\n  `dim_pneus` varchar(45) DEFAULT NULL,\n  `volant` varchar(45) DEFAULT NULL,\n  `cylindre` varchar(45) DEFAULT NULL,\n  `conducteur` int(11) DEFAULT NULL,\n  `periode_debut_conducteur` datetime DEFAULT NULL,\n  `periode_fin_conducteur` datetime DEFAULT NULL,\n  `active_conducteur` int(11) DEFAULT NULL,\n  `affected_to` int(11) DEFAULT NULL,\n  `debut_affected` datetime DEFAULT NULL,\n  `fin_affected` datetime DEFAULT NULL,\n  `active_autopartage` int(11) DEFAULT 0,\n  `cout_possession` float DEFAULT NULL,\n  `last_kilometrage_save` datetime DEFAULT NULL,\n  `agrement_id` int(11) DEFAULT NULL,\n  `agrement_etat` int(11) DEFAULT NULL COMMENT \'0 : En attente d’approbation,\\n1: Approuvé\\n2: Rejeté\',\n  `acquisition` varchar(45) DEFAULT NULL,\n  `prix_acquisition` float DEFAULT NULL,\n  `model_device` varchar(65) DEFAULT NULL,\n  `last_date_fuel` datetime DEFAULT NULL,\n  `alert_send_carburant` int(11) DEFAULT 0,\n  `ammortissement_id` int(11) DEFAULT 0,\n  `inputs` varchar(5) DEFAULT NULL COMMENT \'Pour comafrique : Etat des entrées/sorties* du boîtier (uniquement disponible si véhicule équipé d’un boîtier de télématique en service)\\n\\n// Exemple :       3 (decimal) <---> 0011 (Binary) \\n// Input port      Input4    Input3    Input2    Input1(contact)\\n // coleur cable    violet     vert      gris      blnc \\n // Binary code       0         0         1         1  \\n // Status           Off       Off        On        On \',\n  `cap` int(11) DEFAULT NULL COMMENT \'Pour comafrique : Cap (en degrés) de la dernière position connue du véhicule (uniquement disponible si véhicule équipé d’un boîtier de télématique en service)\\n\\ncap (∞0-360) :\',\n  `mileage_g` float DEFAULT NULL,\n  `mileage_t` float DEFAULT NULL,\n  `mileage` float DEFAULT NULL,\n  `create_device_gpswox` datetime DEFAULT NULL,\n  `last_add_device_data` datetime DEFAULT NULL,\n  `distance_parcourue_auj` float DEFAULT 0,\n  `fuel_consumption_auj` float DEFAULT 0,\n  `gestion` int(11) DEFAULT 1,\n  `img_ext` varchar(200) DEFAULT \'https://mix.technchange.net/media/assets/images/icons/voiture.svg\',\n  `img_int` varchar(200) DEFAULT \'https://mix.technchange.net/media/uploads/vehicule_int.svg\',\n  `cg_recto` varchar(200) DEFAULT \'https://mix.technchange.net/media/uploads/cartegriserecto.svg\',\n  `cg_verso` varchar(200) DEFAULT \'https://mix.technchange.net/media/uploads/cartegriseverso.svg\',\n  `direction_id` int(11) DEFAULT NULL,\n  `nomcoffret` varchar(45) DEFAULT NULL,\n  `idkey_in_coffret` int(11) DEFAULT NULL,\n  `id_cle` int(11) DEFAULT NULL,\n  `keyState` varchar(5) DEFAULT NULL,\n  `bache` int(11) DEFAULT 0,\n  `caisse` int(11) DEFAULT 0,\n  `img_bache` varchar(200) DEFAULT NULL,\n  `img_caisse` varchar(200) DEFAULT NULL,\n  `doc_caisse` varchar(200) DEFAULT NULL,\n  `doc_bache` varchar(200) DEFAULT NULL,\n  `renouvellement` date DEFAULT NULL,\n  `alert_send_renouvellement` int(11) DEFAULT 0,\n  `charge_utile` int(11) DEFAULT NULL,\n  `lld` int(11) DEFAULT 0,\n  `prix_cession` float DEFAULT NULL,\n  `val_dep` float DEFAULT NULL,\n  `date_cir` date DEFAULT NULL,\n  `date_acq` date DEFAULT NULL,\n  `generate_first_visite` int(11) NOT NULL DEFAULT 0,\n  `balise_marque` varchar(65) DEFAULT NULL,\n  `balise_model` varchar(65) DEFAULT NULL,\n  `anti_demarrage` int(11) NOT NULL DEFAULT 0,\n  `anti_relai_installe` int(11) NOT NULL DEFAULT 0,\n  `envoi_notif_block_vehicule` int(11) NOT NULL DEFAULT 1,\n  `envoi_notif_de_block_vehicule` int(11) NOT NULL DEFAULT 1,\n  `mouvement` int(11) NOT NULL DEFAULT 0,\n  `demarrage` int(11) NOT NULL DEFAULT 0,\n  `lancement_anti_demarrage` int(11) NOT NULL DEFAULT 0,\n  `bloc_vehicule_sans_reservation` int(11) DEFAULT 0,\n  `gestionnaire_desactive_relai` int(11) DEFAULT 0,\n  `stop_duration` varchar(45) DEFAULT NULL,\n  `ibutton_id` varchar(45) DEFAULT NULL,\n  `last_kilometrage_save_value` double DEFAULT 0,\n  `engine_hours` double DEFAULT 0,\n  `stop_duration_seconde` double DEFAULT NULL,\n  `personne` int(11) DEFAULT 0,\n  `last_rpm` double DEFAULT 0,\n  `affectation_id` int(11) DEFAULT 0,\n  `alert_sans_reservation` int(11) DEFAULT 1,\n  `isconnected` tinyint(1) DEFAULT 0,\n  `gps_fixe` tinyint(1) DEFAULT 0,\n  `choix_vehicule_affectation` tinyint(1) DEFAULT 0,\n  `latest_speed` varchar(200) DEFAULT NULL,\n  `zone_in` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,\n  `moto` int(11) DEFAULT 0,\n  `driver_rfid` varchar(45) DEFAULT NULL,\n  `private` int(11) DEFAULT 0,\n  `update_device_gpswox` datetime DEFAULT NULL,\n  `old_plate_number` varchar(45) DEFAULT NULL,\n  PRIMARY KEY (`id`),\n  KEY `cat_vehicule` (`categorie_vehicule_id`),\n  KEY `active` (`active`),\n  KEY `entreprise_id` (`entreprise_id`),\n  KEY `etat` (`etat`,`conducteur`),\n  KEY `conducteur` (`conducteur`),\n  KEY `ID_CLE` (`id_cle`),\n  KEY `balise` (`balise_gps_id`),\n  KEY `marque` (`marque`),\n  KEY `model` (`model`)\n) ENGINE=MyISAM AUTO_INCREMENT=4735 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci\'',
                id: 'user-message',
            },
            {
                role: 'assistant',
                text: 'Merci jai bien reçu le schemas de la table tbl_vehicule',
                id: 'assistant-message',
            }, */
            ...messageList,
        ]
        /* const newMessage1 = {
            role: 'user',
            content: 'd\'abord voici le schema de la table tbl_users\n\'tbl_users\', \'CREATE TABLE `tbl_users` (\n  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,\n  `gpswox_id` int(11) DEFAULT NULL,\n  `gpswox_driver_id` int(11) DEFAULT NULL,\n  `invite_by` int(11) DEFAULT NULL,\n  `riverid` varchar(128) DEFAULT NULL,\n  `name` varchar(200) DEFAULT NULL,\n  `prenom` varchar(200) DEFAULT NULL,\n  `ibutton_id` varchar(45) DEFAULT NULL,\n  `telephone_old` varchar(50) DEFAULT NULL,\n  `telephone` varchar(10) DEFAULT NULL,\n  `annee_naissance` varchar(4) DEFAULT NULL,\n  `poste` varchar(200) DEFAULT NULL,\n  `entreprise` int(11) unsigned DEFAULT NULL,\n  `site` int(11) DEFAULT NULL,\n  `responsable` int(11) unsigned DEFAULT NULL,\n  `email` varchar(127) DEFAULT NULL,\n  `username` varchar(100) NOT NULL DEFAULT \'\',\n  `password` char(50) DEFAULT NULL,\n  `deviceid` text DEFAULT NULL,\n  `logins` int(10) unsigned NOT NULL DEFAULT 0,\n  `last_login` int(10) unsigned DEFAULT NULL,\n  `loginsapi` int(11) DEFAULT NULL,\n  `last_loginapi` int(11) DEFAULT NULL,\n  `notify` tinyint(1) NOT NULL DEFAULT 0 COMMENT \'Flag incase admin opts in for email notifications\',\n  `gestionnaire_site` varchar(200) DEFAULT NULL,\n  `notify_vehicule_non_reserve` int(11) NOT NULL DEFAULT 1,\n  `updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),\n  `color` varchar(6) NOT NULL DEFAULT \'FF0000\',\n  `code` varchar(30) DEFAULT NULL,\n  `confirmed` tinyint(1) NOT NULL DEFAULT 0,\n  `phone_confirmed` int(1) NOT NULL DEFAULT 0,\n  `code_confirmation` varchar(50) DEFAULT NULL,\n  `public_profile` tinyint(1) NOT NULL DEFAULT 1,\n  `approved` tinyint(1) NOT NULL DEFAULT 0,\n  `needinfo` tinyint(1) NOT NULL DEFAULT 0,\n  `img` varchar(100) NOT NULL DEFAULT \'user.png\',\n  `created` varchar(100) DEFAULT NULL,\n  `failed_attempts` datetime DEFAULT NULL,\n  `last_attempt` datetime DEFAULT NULL,\n  `newlester` int(11) NOT NULL DEFAULT 0,\n  `sexe` varchar(50) DEFAULT NULL,\n  `adresse` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,\n  `description` text DEFAULT NULL,\n  `preferance_chat` varchar(15) NOT NULL DEFAULT \'vYes_14\',\n  `preferance_music` varchar(15) NOT NULL DEFAULT \'vYes_15\',\n  `preferance_smoking` varchar(15) NOT NULL DEFAULT \'vNo_16\',\n  `preferance_animals` varchar(15) NOT NULL DEFAULT \'vNo_17\',\n  `preferance_chat_title` varchar(200) DEFAULT NULL,\n  `preferance_music_title` varchar(200) DEFAULT NULL,\n  `preferance_smoking_title` varchar(200) DEFAULT NULL,\n  `notification_reservation` int(11) DEFAULT 1,\n  `notification_outlook` int(11) NOT NULL DEFAULT 1,\n  `notification_covoiturage_mobile` int(11) NOT NULL DEFAULT 1,\n  `notification_message_mobile` int(11) NOT NULL DEFAULT 1,\n  `notification_commentaire_mobile` int(11) NOT NULL DEFAULT 1,\n  `notification_avis_mobile` int(11) NOT NULL DEFAULT 1,\n  `notification_reservation_cloturer` int(11) NOT NULL DEFAULT 1,\n  `notification_message` int(11) NOT NULL DEFAULT 1,\n  `notification_update_reservation` int(11) NOT NULL DEFAULT 1,\n  `notification_notation_user` int(11) NOT NULL DEFAULT 1,\n  `notification_commentaire_user` int(11) NOT NULL DEFAULT 1,\n  `notification_member_demande_covoiturage` int(11) NOT NULL DEFAULT 1,\n  `notification_reservation_covoiturage` int(11) NOT NULL DEFAULT 1,\n  `notification_reservation_sms` int(11) NOT NULL DEFAULT 1,\n  `notification_reservation_cloturer_sms` int(11) NOT NULL DEFAULT 1,\n  `notification_message_sms` int(11) NOT NULL DEFAULT 1,\n  `notification_update_reservation_sms` int(11) NOT NULL DEFAULT 1,\n  `notification_notation_user_sms` int(11) NOT NULL DEFAULT 1,\n  `notification_commentaire_user_sms` int(11) NOT NULL DEFAULT 1,\n  `notification_member_demande_covoiturage_sms` int(11) NOT NULL DEFAULT 1,\n  `matricule` varchar(100) DEFAULT NULL,\n  `department` varchar(100) DEFAULT NULL,\n  `active` int(11) NOT NULL DEFAULT 1,\n  `date_inscription` datetime DEFAULT NULL,\n  `previously_admin` int(11) NOT NULL DEFAULT 0,\n  `adresse_domicile` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,\n  `site_travail` int(11) NOT NULL DEFAULT 0,\n  `notify_user` int(11) NOT NULL DEFAULT 1,\n  `total_view` int(11) NOT NULL DEFAULT 0,\n  `alert_opc_mobile` int(11) NOT NULL DEFAULT 0,\n  `alert_nouveau_user` int(11) DEFAULT 1,\n  `user_lat` varchar(50) DEFAULT NULL,\n  `user_lng` varchar(50) DEFAULT NULL,\n  `last_update_position` datetime DEFAULT NULL,\n  `checkDriverArrived` int(11) NOT NULL DEFAULT 0,\n  `checkTripStarted` int(11) NOT NULL DEFAULT 0,\n  `checkTripEnd` int(11) NOT NULL DEFAULT 0,\n  `profession` varchar(150) DEFAULT NULL,\n  `jour_naissance` varchar(2) DEFAULT NULL,\n  `mois_naissance` varchar(2) DEFAULT NULL,\n  `notification_message_email` int(11) NOT NULL DEFAULT 1,\n  `notification_booking_email` int(11) NOT NULL DEFAULT 1,\n  `notification_ride_agent_match_email` int(11) NOT NULL DEFAULT 1,\n  `notification_news_email` int(11) NOT NULL DEFAULT 1,\n  `notification_sms_notifications` int(11) NOT NULL DEFAULT 1,\n  `facebook_verified` int(11) NOT NULL DEFAULT 0,\n  `friends_facebook` int(11) NOT NULL DEFAULT 0,\n  `type_user` int(11) NOT NULL DEFAULT 1 COMMENT \'0: passager 1 : conducteur\',\n  `type_user_vrai` int(11) DEFAULT 1,\n  `mc_device` text DEFAULT NULL,\n  `mc_id` varchar(20) DEFAULT NULL,\n  `commercial_id` int(11) DEFAULT NULL,\n  `date_create_mc` datetime DEFAULT NULL,\n  `position_create_mc` varchar(100) DEFAULT NULL,\n  `observation_mc` text DEFAULT NULL,\n  `verified_mc` int(11) DEFAULT 0,\n  `assurance_id` varchar(50) DEFAULT NULL,\n  `date_souscription` datetime DEFAULT NULL,\n  `formule` varchar(50) DEFAULT NULL,\n  `last_paiement_assurance` datetime DEFAULT NULL,\n  `compte_paiement` varchar(10) DEFAULT NULL,\n  `num_paiement` varchar(8) DEFAULT NULL,\n  `lieu_naissance` varchar(150) DEFAULT NULL,\n  `permis_confirmed` int(11) NOT NULL DEFAULT 0,\n  `cni_confirmed` int(11) NOT NULL DEFAULT 0,\n  `photo_confirmed` int(11) NOT NULL DEFAULT 0 COMMENT \'1 : confirmé 3: photo incorrect 2: en cours de vérification 0 : aucune photo\',\n  `addpreference` int(11) NOT NULL DEFAULT 0,\n  `enregistrement_basic` int(11) NOT NULL DEFAULT 0,\n  `adresse_lat` varchar(20) DEFAULT NULL,\n  `adresse_lng` varchar(20) DEFAULT NULL,\n  `trajet_domicile_travail_passager` int(11) NOT NULL DEFAULT 0,\n  `trajet_domicile_travail` int(11) NOT NULL DEFAULT 0,\n  `amsa_phase2` int(11) NOT NULL DEFAULT 0,\n  `passer_etape_sms` int(11) DEFAULT NULL,\n  `clic_lien_sms` int(11) DEFAULT NULL,\n  `service` int(11) DEFAULT 0,\n  `code_parainnage` varchar(50) DEFAULT NULL,\n  `direction` varchar(50) DEFAULT NULL,\n  `cg_confirmed` int(11) DEFAULT 0,\n  `black_friday_confirmed` int(11) DEFAULT 0,\n  `require_notification_messenger` int(11) DEFAULT 1,\n  `sender_id` varchar(45) DEFAULT NULL,\n  `valide_affectation` int(11) DEFAULT 0,\n  `valide_affectation_direction` int(11) DEFAULT 0,\n  `notif_gestionnaire` int(11) DEFAULT 0,\n  `valide_affectation_responsable` int(11) DEFAULT 0,\n  `group_id` int(11) DEFAULT NULL,\n  `date_naissance` date DEFAULT NULL,\n  `vehicule_affected` int(11) DEFAULT NULL,\n  `debut_vehicule_affected` datetime DEFAULT NULL,\n  `fin_vehicule_affected` datetime DEFAULT NULL,\n  `view_all_vehicules` int(11) DEFAULT 0,\n  `require_abonnement` int(11) DEFAULT 0,\n  `confirme_via` int(11) DEFAULT 0,\n  `gsp` varchar(45) DEFAULT NULL,\n  `valide_service` int(11) DEFAULT 0,\n  `notify_scheduler` int(11) DEFAULT 0,\n  `envoi` int(11) DEFAULT 0,\n  `many_affectation` int(11) DEFAULT 0,\n  `status_label` varchar(45) DEFAULT \'Actif\',\n  `groupe_liste` varchar(45) DEFAULT \'Employé\',\n  `telephone_flotte` varchar(45) DEFAULT NULL,\n  `envoi_sms` int(11) DEFAULT 0,\n  `login_id_coffret` int(11) DEFAULT NULL,\n  `photo` varchar(200) DEFAULT NULL,\n  `login_no_coffret` varchar(45) DEFAULT NULL,\n  `voir_vehicule_par_direction` int(11) DEFAULT 1,\n  `choix_vehicule_affectation` int(11) DEFAULT 0,\n  `role` varchar(45) DEFAULT \'user\',\n  `gestion` longtext DEFAULT NULL,\n  `ibeacon_id` varchar(45) DEFAULT NULL,\n  `prefix_entreprise` varchar(45) DEFAULT NULL,\n  PRIMARY KEY (`id`),\n  UNIQUE KEY `uniq_username` (`username`),\n  KEY `users_entreprise_id_foreign` (`entreprise`),\n  KEY `users_active_index` (`active`),\n  KEY `respo` (`responsable`),\n  KEY `group` (`group_id`),\n  KEY `site_travail` (`site_travail`),\n  KEY `login_id_coffret` (`login_id_coffret`),\n  KEY `gpswox_driver_id` (`gpswox_driver_id`)\n) ENGINE=MyISAM AUTO_INCREMENT=2671 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT=\'Stores registered usersÃ¢â‚¬â„¢ information\'',
        } */
        /* const newMessage2 = {
            role: 'assistant',
            content: 'Merci j\'ai bien reçu le schemas de la table tbl_users',
        } */
        // messageList.push(newMessage1)
        // messageList.push(newMessage2)
        messageList = messageList.map(message => ({
            role: message.role,
            content: message.text,
        }))

        // TODO: Add knowledge to the conversation
        // if (knowledgeUsedInConversation.value.length > 0) {
        //     let lastMessageId = lastSystemMessage?.id
        //     for (const knowledge of knowledgeUsedInConversation.value) {
        //         const messageId = nanoid()
        //         lastMessages.push({
        //             id: messageId,
        //             role: 'user',
        //             text: `Use this as knowledge for the rest of our conversation:\n${knowledge?.sections[0]?.content}\n---`,
        //             parentMessageId: lastMessageId,
        //             updatedAt: new Date(),
        //             createdAt: new Date(),
        //         })
        //         lastMessageId = messageId
        //     }
        //     userMessage.parentMessageId = lastMessageId
        // }

        // Count the tokens to see if message is too long
        const getTokenCount = () => encode(messageList.map(message => message.content).join('\n\n')).length
        let lastTokenCount = getTokenCount()
        if (getTokenCount() > MaxTokensPerModel[modelUsed.value]) {
            logger.info('Le message est trop long, suppression des messages...', { lastTokenCount, MaxTokensPerModel, modelUsed })
            // Remove the first message that is not a system message
            // until the token count is less than the max or there are no more messages
            while (messageList.length > 1 && lastTokenCount > MaxTokensPerModel[modelUsed.value]) {
                messageList = [
                    messageList[0],
                    ...(messageList.filter(({ role }) => role !== 'system').slice(1)),
                ]
                lastTokenCount = getTokenCount()
            }
            if (messageList.length === 1) {
                await addErrorMessage('Votre message est trop long, veuillez réessayer.')
                return
            }
        }
        console.log(`LAST TOKEN LENGHT:${lastTokenCount}`)
        let thisMessage: ChatMessage | null = null
        let messageCreated = false

        const upsertAssistantMessage = async (messageResponse: types.Message, finalUpdate?: boolean) => {
            if (!thisMessage) {
                thisMessage = await getMessageById(fromConversation.id, messageResponse.id)
            }

            if (thisMessage) {
                await updateLastAssistantMessage(fromConversation.id, messageResponse)
                if (finalUpdate) {
                    if (isDetaEnabled.value) {
                        deta.message.update(getUpdatedMessage(messageResponse, fromConversation.id))
                    }
                }
            }
            else if (!messageCreated) {
                messageCreated = true
                await addMessageToConversation(fromConversation.id, messageResponse)
            }
        }

        const { sendMessage } = useLanguageModel()
        const abortController = new AbortController()
        conversationAbortMap.value[fromConversation.id] = abortController
        const { data: assistantMessage, error: messageError } = await handle(sendMessage({
            messages: messageList,
            model: fromConversation.settings?.model || modelUsed.value,
            max_tokens: Number(fromConversation.settings?.maxTokens || maxTokens.value) > 0 ? Number(fromConversation.settings?.maxTokens || maxTokens.value) : undefined,
            temperature: resolveCreativity(fromConversation.settings?.creativity),
            async onProgress(partial: types.Message) {
                await upsertAssistantMessage(partial)
            },
            choix: selectedChoices,
            monchoixgraph: monchoixGraph,
            monchoixintdata: monchoixIntData,
            signal: abortController.signal,
            idconversation: fromConversation.id,
            stream: true,
        }))

        if (messageError) {
            const { cause } = (messageError as any)
            const errorCode: string = cause.error.code || cause.error.type
            logger.error('Enreur d\envoie du message', cause, cause.error)
            const errorHandlerMapping = {
                async model_not_found() {
                    await addErrorMessage('Le modèle que vous utilisez n\'est pas disponible. Veuillez sélectionner un autre modèle dans les paramètres.')
                },
                async context_length_exceeded() {
                    await addErrorMessage('Votre message est trop long ou le nombre maximum de jetons est trop élevé, veuillez réessayer avec un message plus court ou avec moins de jetons au maximum.')
                },
                async invalid_api_key() {
                    await addErrorMessage('Votre clé API n\'est pas valide.Veuillez vérifier votre clé API dans les paramètres.')
                },
                async insufficient_quota() {
                    await addErrorMessage('Quota insuffisant.Si vous utilisez un forfait gratuit, envisagez de passer à un forfait payant à l\'utilisation.')
                },
            } as Record<string, () => Promise<void>>

            if (errorCode in errorHandlerMapping) {
                await errorHandlerMapping[errorCode]()
            }
        }
        else {
            if (assistantMessage) {
                assistantMessage.parentMessageId = userMessage.id
                setConversationTypingStatus(fromConversation.id, false)
                await upsertAssistantMessage(assistantMessage as any, true)
                await updateConversationList()

                if (fromConversation.title.trim() === 'Conversation sans titre') {
                    await generateConversationTitle(fromConversation.id)
                }
            }
        }

        setConversationTypingStatus(fromConversation.id, false)

        // TODO: Add follow up questions feature
        // getFollowupQuestions(message)
        logger.info('Switched to conversation with id ', message)
    }

    const switchConversation = async (id: string) => {
        currentConversationId.value = id
        currentConversation.value = await getConversationById(id)
        logger.info('Switched to conversation with id ', currentConversation.value?.id)
    }

    async function generateConversationTitle(conversationId: string) {
        const conversation = await getConversationById(conversationId)
        if (!conversation) {
            return ''
        }
        const lastMessages = conversation.messages.slice(-3)
        const lastMessagesContent = lastMessages.map((message: ChatMessage) => message.text)
        const conversationTitle = await complete(lastMessagesContent.join('\n'), {
            systemMessage: 'You are a very clever machine that can determine a very short title for a conversation. The user sends you the content of a conversation and you only output a very short title for it, really concise. Title:',
            temperature: 0,
            maxTokens: Number(maxTokens),
        })

        conversation.title = conversationTitle?.replace(/Title\:/g, '').replace(/\"/g, '').trim()
        await updateConversation(conversationId, conversation)
    }

    async function removeMessageFromConversation(conversationId: string, messageId: string) {
        const conversation = await getConversationById(conversationId)
        if (!conversation) {
            return
        }
        conversation.messages = conversation.messages.filter((message: ChatMessage) => message.id !== messageId)
        await updateConversation(conversationId, conversation)
        if (isDetaEnabled.value) {
            deta.message.delete(messageId)
        }
    }

    async function clearConversations() {
        if (!conversationList.value) {
            return
        }
        const limit = pLimit(10)
        await Promise.all(conversationList.value.map(
            (conversation: types.Conversation) => limit(() => deleteConversation(conversation.id)),
        ))
        const newConversation = await createConversation('Conversation sans titre')
        await switchConversation(newConversation.id)
    }

    function setConversationTypingStatus(conversationId: string, status: boolean) {
        isTyping.value = {
            ...isTyping.value,
            [conversationId]: status,
        }
    }

    async function getFollowupQuestions(text: string) {
        const client = new OpenAIApi(new Configuration({
            apiKey: apiKey.value || '',
        }))
        const response = await client.createCompletion({
            model: 'text-davinci-003',
            prompt: [
                'Given the last user question:',
                text,
                'Output 3 questions that the user might ask next, one by line, without list number. The last line has only ###:',
            ].join('\n'),
            stop: '###',
            max_tokens: 500,
        })
        followupQuestions.value = {
            ...followupQuestions.value,
            [currentConversationId.value]: (response.data.choices[0].text || '').split('\n').filter((text: string) => text.trim() !== ''),
        }
    }

    async function stopConversationMessageGeneration(conversationId: string) {
        const abortController = conversationAbortMap.value[conversationId]
        if (abortController) {
            abortController.abort()
        }
    }

    async function updateConversationMessage(conversationId: string, messageId: string, message: Partial<types.Message>) {
        const conversation = await getConversationById(conversationId)
        if (!conversation) {
            return
        }
        const messageIndex = conversation.messages.findIndex((m: types.Message) => m.id === messageId)
        if (messageIndex === -1) {
            return
        }
        conversation.messages[messageIndex] = {
            ...conversation.messages[messageIndex],
            ...message,
        }
        await updateConversation(conversationId, conversation)
        if (isDetaEnabled.value) {
            deta.message.update(conversation.messages[messageIndex])
        }
    }

    return {
        clearConversations,
        clearErrorMessages,
        cloneConversation,
        conversationList,
        addMessageToConversation,
        createConversation,
        currentConversation,
        deleteConversation,
        followupQuestions,
        forkConversation,
        getConversationById,
        isTyping,
        isTypingInCurrentConversation,
        knowledgeUsedInConversation,
        listConversations,
        removeMessageFromConversation,
        sendMessage,
        stopConversationMessageGeneration,
        switchConversation,
        updateConversation,
        updateConversationSettings,
        updateConversationList,
        updateConversationMessage,
    }
}

function getUpdatedMessage(message: ChatMessage, conversationId: string): types.Message {
    return {
        ...message,
        updatedAt: new Date(),
        createdAt: (message as types.Message).createdAt || new Date(),
        conversationId,
    }
}

function getMessageChain(messages: ChatMessage[], message: ChatMessage): ChatMessage[] {
    const parentMessage = messages.find((m: ChatMessage) => m.id === message.parentMessageId)
    if (!parentMessage) {
        return [message]
    }
    return [...getMessageChain(messages, parentMessage), message]
}

function getDefaultSystemMessage() {
    const currentDate = new Date().toISOString().split('T')[0]
    return trimIndent(`
        You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible or generate in one block a python code when it necessary.
        Knowledge cutoff: 2021-09-01
        Current date: ${currentDate}
    `)
}

function resolveCreativity(creativity?: types.Creativity | null) {
    if (!creativity) {
        return 0.7
    }
    return mapValue({
        none: 0.0,
        normal: 0.7,
        high: 1.2,
    }, creativity, 0.7)
}
