import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const userId = req.user?._id

    try {
        const channelStats = await Video.aggregate([
            {
                $match: {
                    owner: { $eq: { $toObjectId: userId } },
                },
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "Likes", 
                },
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "owner",
                    foreignField: "channel",
                    as: "Subscribers",
                },
            },
            {
                $group: {
                    _id: null,
                    TotalVideos: { $sum: 1 },
                    TotalLikes: { $first: { $size: "$Likes" } },
                    TotalSubscribers: { $first: { $size: "$Subscribers" } },
                    TotalViews: { $sum: "$views" },
                },
            },
            {
                $project: {
                    _id: 0,
                    TotalSubscribers: 1,
                    TotalLikes: 1,
                    TotalVideos: 1,
                    TotalViews: 1,
                },
            },
        ])
        if (!channelStats) {
            throw new ApiError(500, "Unable to fetch the channel stat!")
        }
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    channelStats[0],
                    "Channel Stat fetched Successfully"
                )
            )
    } catch (error) {
        throw new ApiError(500, error?.message || "Unable to get stats")
    }
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const userId = req.user?._id
    try {
        const videos = await Video.find({ owner: userId })

        if (!videos || videos.length === 0) {
            return res
                .status(200)
                .json(new ApiResponse(200, videos, "No video published yet"))
        }

        return res
            .status(200)
            .json(new ApiResponse(200, videos, "All videos fetched"))
    } catch (error) {
        throw new ApiError(200, error?.message || "Unable to get the videos")
    }
})

export { getChannelStats, getChannelVideos }
