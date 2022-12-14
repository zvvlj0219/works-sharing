import express from 'express'
import db from '../config/db'
import portfolioSchema from '../models/Portfolio'
import { Portfolio, Review } from '../types'

const router = express.Router()

/*
 * レビューを追加
 * @params {object} req - req object PostBodyParams
 * @params {object} res - res object Portfolio
 */
interface PostBodyParams {
    body: {
        username: string
        text: string
        star: number
        review_avg: number
    }
    params: {
        id: string
    }
}

router.post('/:id', async (req, res) => {
    const {
        body: { username, text, star, review_avg },
        params: { id }
    } = req as PostBodyParams

    const new_review: Review = {
        createdAt: String(new Date()),
        text,
        username,
        star
    }

    const result = await portfolioSchema
        .findByIdAndUpdate(
            id,
            {
                $push: {
                    review: new_review
                },
                $set: {
                    review_avg
                }
            },
            {
                returnDocument: 'after'
            }
        )
        .lean()

    if (!result) return res.status(400).json({ msg: 'no found' })

    const convertedDocument = db.convertDocToObj<Portfolio>(result)

    return res.status(200).json({ result: convertedDocument })
})

/*
 * いいねボタン押下
 * @params {object} req - req object likePost
 * @params {object} res - res object Portfolio
 */
interface LikePost {
    body: {
        newLike: {
            email: string
        }
    }
    params: {
        id: string
    }
}

router.post('/like/:id', async (req, res) => {
    const {
        params: { id },
        body: { newLike }
    } = req as LikePost

    const portfolioObj = await portfolioSchema.findById(id).lean()

    if (!portfolioObj) return res.status(400).json({ msg: 'not found' })

    const existedLikeIndex = portfolioObj.like.findIndex((likeobj) => {
        return likeobj.email === newLike.email
    })

    if (existedLikeIndex !== -1) {
        // すでにいいねしているので
        // いいねを外す
        const result = await portfolioSchema
            .findByIdAndUpdate(
                id,
                {
                    $pull: {
                        like: {
                            email: newLike.email
                        }
                    }
                },
                {
                    returnDocument: 'after'
                }
            )
            .lean()

        if (!result) return res.status(400).json({ msg: 'no found' })

        const convertedDocument = db.convertDocToObj<Portfolio>(result)

        return res.status(200).json({ msg: 'ok', result: convertedDocument })
    } else {
        //まだいいねしていないので
        //いいねを追加する
        // いまいちを押していたら外す
        const result = await portfolioSchema
            .findByIdAndUpdate(
                id,
                {
                    $push: {
                        like: {
                            email: newLike.email
                        }
                    },
                    $pull: {
                        dislike: {
                            email: newLike.email
                        }
                    }
                },
                {
                    returnDocument: 'after'
                }
            )
            .lean()

        if (!result) return res.status(400).json({ msg: 'no found' })

        const convertedDocument = db.convertDocToObj<Portfolio>(result)

        return res.status(200).json({ msg: 'ok', result: convertedDocument })
    }
})

/*
 * いまいちボタン押下
 * @params {object} req - req object DislikePost
 * @params {object} res - res object Portfolio
 */
interface DislikePost {
    body: {
        newDislike: {
            email: string
        }
    }
    params: {
        id: string
    }
}

router.post('/dislike/:id', async (req, res) => {
    const {
        params: { id },
        body: { newDislike }
    } = req as DislikePost

    const portfolioObj = await portfolioSchema.findById(id).lean()

    if (!portfolioObj) return res.status(400).json({ msg: 'not found' })

    const existedLikeIndex = portfolioObj.dislike.findIndex((dislikeobj) => {
        return dislikeobj.email === newDislike.email
    })

    if (existedLikeIndex !== -1) {
        // すでにいまいちしているので
        // いまいちを外す
        const result = await portfolioSchema
            .findByIdAndUpdate(
                id,
                {
                    $pull: {
                        dislike: {
                            email: newDislike.email
                        }
                    }
                },
                {
                    returnDocument: 'after'
                }
            )
            .lean()

        if (!result) return res.status(400).json({ msg: 'no found' })

        const convertedDocument = db.convertDocToObj<Portfolio>(result)

        return res.status(200).json({ msg: 'ok', result: convertedDocument })
    } else {
        //まだいまいちしていないので
        //いまいちを追加する
        // いいねを押していたら外す
        const result = await portfolioSchema
            .findByIdAndUpdate(
                id,
                {
                    $push: {
                        dislike: {
                            email: newDislike.email
                        }
                    },
                    $pull: {
                        like: {
                            email: newDislike.email
                        }
                    }
                },
                {
                    returnDocument: 'after'
                }
            )
            .lean()

        if (!result) return res.status(400).json({ msg: 'no found' })

        const convertedDocument = db.convertDocToObj<Portfolio>(result)

        return res.status(200).json({ msg: 'ok', result: convertedDocument })
    }
})

export default router
