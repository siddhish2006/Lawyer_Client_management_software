import { AppDataSource } from "../config/data-source";
import { Client } from "../entities/Client";
import { ClientType } from "../entities/ClientType";
import { CreateClientDTO } from "../dtos/client/CreateClient.dto";

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

    // Get repository once (cheap + efficient)
    private static clientRepo = AppDataSource.getRepository(Client);
    private static clientTypeRepo = AppDataSource.getRepository(ClientType);

    /**
     * CREATE CLIENT
     *
     * This is NOT just "insert into DB".
     * We enforce rules here.
     */
    static async createClient(dto: CreateClientDTO): Promise<Client> {

        //--------------------------------------------------
        // 1️⃣ Validate Client Type Exists
        //--------------------------------------------------

        const clientType = await this.clientTypeRepo.findOne({
            where: { id: dto.client_type_id }
        });

        if (!clientType) {
            throw new Error("Invalid client type");
        }

        //--------------------------------------------------
        // 2️⃣ Prevent Duplicate Clients
        //--------------------------------------------------
        // Extremely important in legal systems.
        // Duplicate clients = nightmare.

        const existingClient = await this.clientRepo.findOne({
            where: [
                { phone_number: dto.phone_number },
                { email: dto.email }
            ]
        });

        if (existingClient) {
            throw new Error("Client already exists with phone/email");
        }

        //--------------------------------------------------
        // 3️⃣ Create Entity Instance
        //--------------------------------------------------

        const client = this.clientRepo.create({
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

        return await this.clientRepo.save(client);
    }

    /**
     * FETCH CLIENT BY ID
     */
    static async getClientById(id: number): Promise<Client | null> {

        if (!id) {
            throw new Error("Client ID required");
        }

        return this.clientRepo.findOne({
            where: { client_id: id },

            // LOAD RELATIONS 🔥
            relations: {
                client_type: true,
                case_links: true,
                defendant_links: true
            }
        });
    }

    /**
     * LIST CLIENTS WITH FILTERING
     *
     * THIS is what separates junior vs senior backends.
     *
     * Never return raw tables.
     * Always support filtering.
     */
    static async listClients(filters: any): Promise<Client[]> {

        const qb = this.clientRepo.createQueryBuilder("client")
            .leftJoinAndSelect("client.client_type", "clientType");

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

        //--------------------------------------------------
        // Pagination 🔥 (VERY IMPORTANT)
        //--------------------------------------------------

        const page = Number(filters.page) || 1;
        const limit = Number(filters.limit) || 20;

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

        const client = await this.getClientById(id);

        if (!client) {
            throw new Error("Client not found");
        }

        //--------------------------------------------------
        // Merge DTO into existing entity
        //--------------------------------------------------

        Object.assign(client, dto);

        return this.clientRepo.save(client);
    }

    /**
     * DELETE CLIENT
     *
     * NOTE:
     * In legal systems — HARD DELETE is dangerous.
     *
     * Later you may want SOFT DELETE.
     */
    static async deleteClient(id: number): Promise<void> {

        const client = await this.getClientById(id);

        if (!client) {
            throw new Error("Client not found");
        }

        await this.clientRepo.remove(client);
    }
}
