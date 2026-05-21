import { Availability_Enum } from "../../enum/post.enum"
import { IRequest } from "../../middlware/authentication"



export const AvailabilityPost = (req: IRequest) => {
    return {
        $or: [
            { availability: Availability_Enum.public },
            { availability: Availability_Enum.only_me, createdBy: req.user?._id! },
            { availability: Availability_Enum.friends, createdBy: { $in: [req.user?._id!, ...(req.user?.friends || [])] } },
            { tags: { $in: [req.user?._id] } }
        ]
    }
}