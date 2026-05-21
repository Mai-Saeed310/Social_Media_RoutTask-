"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create(data) {
        return this.model.create(data);
    }
    async findById(id) {
        return this.model.findById(id);
    }
    async findOne({ filter, projection, options }) {
        return this.model.findOne(filter, projection, { new: true, ...options });
    }
    async find({ filter, projection, options }) {
        return this.model.find(filter, projection)
            .sort(options?.sort)
            .skip(options?.skip)
            .limit(options?.limit)
            .populate(options?.populate);
    }
    findByIdAndUpdate({ id, update, options }) {
        return this.model.findByIdAndUpdate(id, update, { new: true, ...options });
    }
    findOneAndUpdate({ filter, update, options }) {
        return this.model.findOneAndUpdate(filter, update, { new: true, ...options });
    }
    findOneAndDelete({ filter, options }) {
        return this.model.findOneAndDelete(filter, options);
    }
    async paginate({ page, limit, sort, populate, search }) {
        page = +page || 1;
        limit = +limit || 1;
        if (page < 1)
            page = 1;
        if (limit < 1)
            limit = 2;
        const skip = (page - 1) * limit;
        const [data, totalDoc] = await Promise.all([
            this.model.find({ ...(search ?? {}) }).limit(limit).skip(skip).sort(sort).populate(populate).exec(),
            this.model.countDocuments({ ...(search ?? {}) })
        ]);
        const totalPages = Math.ceil(totalDoc / limit);
        return {
            meta: {
                currentPage: page,
                totalPages,
                limit,
                totalDoc
            },
            data
        };
    }
}
exports.BaseRepository = BaseRepository;
