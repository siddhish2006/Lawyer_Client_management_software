import { AppDataSource } from "../config/data-source";
import { Client } from "../entities/Client";
import { ClientType } from "../entities/ClientType";
import { CreateClientDTO } from "../dtos/client/CreateClient.dto";
import { FiltersDTO } from "../dtos/Filters.dto";
import { AppError } from "../errors/AppError";
import { NotFoundError } from "../errors/NotFoundError";

/**
 * ClientService
 * --------------
 * This is where ALL client-related business logic lives.
 *
 * IMPORTANT RULE:
 * Controllers should NEVER talk to the database.
 * ONLY services do.
 */
export class ClientService {

    private static parseBooleanFilter(value: FiltersDTO["has_contact"]): boolean | undefined {
        if (typeof value === "boolean") {
            return value;
        }

        if (typeof value !== "string") {
            return undefined;
        }

        const normalized = value.trim().toLowerCase();

        if (["true", "1", "yes"].includes(normalized)) {
            return true;
        }

        if (["false", "0", "no"].includes(normalized)) {
            return false;
        }

        return undefined;
    }

    /**
     * GET REPOSITORIES (Lazy-loaded after DB init)
     */
    private static getClientRepo() {
        return AppDataSource.getRepository(Client);
    }

    private static getClientTypeRepo() {
        return AppDataSource.getRepository(ClientType);
    }

    /**
     * CREATE CLIENT
     */
    static async createClient(dto: CreateClientDTO): Promise<Client> {
        const clientTypeRepo = this.getClientTypeRepo();
        const clientRepo = this.getClientRepo();

        //--------------------------------------------------
        // 1️⃣ Validate Client Type Exists
        //--------------------------------------------------

        const clientType = await clientTypeRepo.findOne({
            where: { id: dto.client_type_id }
        });

        if (!clientType) {
            throw new AppError("Invalid client type", 400);
        }

        //--------------------------------------------------
        // 2️⃣ Prevent Duplicate Clients
        //--------------------------------------------------

        const duplicateConditions: string[] = [];
        const duplicateParams: Record<string, string> = {};

        if (dto.phone_number) {
            duplicateConditions.push("client.phone_number = :phone_number");
            duplicateParams.phone_number = dto.phone_number;
        }

        if (dto.whatsapp_number) {
            duplicateConditions.push("client.whatsapp_number = :whatsapp_number");
            duplicateParams.whatsapp_number = dto.whatsapp_number;
        }

        if (dto.email) {
            duplicateConditions.push("client.email = :email");
            duplicateParams.email = dto.email;
        }

        if (duplicateConditions.length > 0) {
            const existingClient = await clientRepo
                .createQueryBuilder("client")
                .where(duplicateConditions.join(" OR "), duplicateParams)
                .getOne();

            if (existingClient) {
                throw new AppError(
                    "Client already exists with this phone, WhatsApp number, or email",
                    409
                );
            }
        }

        //--------------------------------------------------
        // 3️⃣ Create Entity Instance
        //--------------------------------------------------

        const client = clientRepo.create({
            full_name: dto.full_name,
            phone_number: dto.phone_number,
            whatsapp_number: dto.whatsapp_number,
            email: dto.email,
            address: dto.address,
            client_type: clientType,
            date_of_association: dto.date_of_association,
            primary_practice_area: dto.primary_practice_area,
            current_legal_relationship: dto.current_legal_relationship,
            referred_by: dto.referred_by,
        });

        //--------------------------------------------------
        // 4️⃣ Save to Database
        //--------------------------------------------------

        return await clientRepo.save(client);
    }

    /**
     * FETCH CLIENT BY ID
     */
    static async getClientById(id: number): Promise<Client> {
        const clientRepo = this.getClientRepo();

        if (!id) {
            throw new AppError("Client ID required", 400);
        }

        const client = await clientRepo.findOne({
            where: { client_id: id },
            relations: {
                client_type: true,
                case_links: true,
                defendant_links: true
            }
        });

        if (!client) {
            throw new NotFoundError("Client not found");
        }

        return client;
    }

    /**
     * LIST CLIENTS WITH FILTERING
     */
    static async listClients(filters: FiltersDTO): Promise<Client[]> {
        const clientRepo = this.getClientRepo();

        const qb = clientRepo.createQueryBuilder("client")
            .leftJoinAndSelect("client.client_type", "clientType");

        const contactPresenceCondition = `
            NULLIF(TRIM(COALESCE(client.phone_number, '')), '') IS NOT NULL
            OR NULLIF(TRIM(COALESCE(client.whatsapp_number, '')), '') IS NOT NULL
            OR NULLIF(TRIM(COALESCE(client.email, '')), '') IS NOT NULL
        `;

        //--------------------------------------------------
        // Dynamic Filters
        //--------------------------------------------------

        if (filters.name) {
            qb.andWhere("LOWER(client.full_name) LIKE LOWER(:name)", {
                name: `%${filters.name}%`
            });
        }

        if (filters.phone) {
            qb.andWhere("client.phone_number = :phone", {
                phone: filters.phone
            });
        }

        if (filters.relationship) {
            qb.andWhere("client.current_legal_relationship = :rel", {
                rel: filters.relationship
            });
        }

        if (filters.client_type_id) {
            qb.andWhere("clientType.id = :ctid", {
                ctid: Number(filters.client_type_id)
            });
        }

        const hasContact = this.parseBooleanFilter(filters.has_contact);

        if (hasContact === true) {
            qb.andWhere(`(${contactPresenceCondition})`);
        }

        if (hasContact === false) {
            qb.andWhere(`NOT (${contactPresenceCondition})`);
        }

        //--------------------------------------------------
        // Pagination
        //--------------------------------------------------

        const page = Math.max(Number(filters.page) || 1, 1);
        const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);

        qb.skip((page - 1) * limit);
        qb.take(limit);

        //--------------------------------------------------
        // Sorting
        //--------------------------------------------------

        qb.orderBy("client.added_on", "DESC");

        return qb.getMany();
    }

    /**
     * UPDATE CLIENT
     */
    static async updateClient(
        id: number,
        dto: Partial<CreateClientDTO>
    ): Promise<Client> {
        const clientRepo = this.getClientRepo();
        const clientTypeRepo = this.getClientTypeRepo();

        const client = await this.getClientById(id);

        //--------------------------------------------------
        // client_type_id is the join column for the
        // client_type relation, NOT a column on the entity.
        // Object.assign would silently no-op it, so resolve
        // the relation explicitly.
        //--------------------------------------------------

        const { client_type_id, ...rest } = dto;

        if (client_type_id !== undefined) {
            const clientType = await clientTypeRepo.findOne({
                where: { id: client_type_id }
            });
            if (!clientType) {
                throw new AppError("Invalid client type", 400);
            }
            client.client_type = clientType;
        }

        Object.assign(client, rest);

        return clientRepo.save(client);
    }

    /**
     * DELETE CLIENT
     */
    static async deleteClient(id: number): Promise<void> {
        const clientRepo = this.getClientRepo();

        const client = await this.getClientById(id);

        await clientRepo.remove(client);
    }
}
