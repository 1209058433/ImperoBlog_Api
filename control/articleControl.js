import Articles from "../model/articles.js";
import Users from '../model/users.js'
import Tags from '../model/tags.js'
import TopArticle from "../model/topArticle.js";
import moment from "moment";
import fs, { readFileSync, writeFileSync } from "fs";
import path from 'path'
import formidable from 'formidable';
const __dirname = path.resolve()


class articlesControl {
    //获取文章列表===============================================================================================
    async getAllArticles(req, res) {
        const all = await Articles.find()

        // const list = await Articles.find()
        // list.map(async (item) => {
        //     await Users.updateOne({ id: item.id }, { $set: { sex: "保密" } })
        // })

        res.send({
            status: 0,
            data: all
        })
    }

    //获取指定id的文章===============================================================================================
    async getIdArticle(req, res) {
        const idArticle = await Articles.find({ id: req.query.id })
        res.send({
            status: 0,
            data: idArticle[0]
        })
    }


    //修改文章===============================================================================================
    async editorArticle(req, res) {
        //获取要修改的文章id
        const editroId = req.body.id
        const editroInfo = req.body.data
        //生成一个写入时间
        moment.locale()
        const uploadTime = moment().format('YYYY-MM-DD hh:mm:ss')
        await Articles.updateOne({ id: editroId }, { $set: { oneSentence: editroInfo.oneSentence, content: editroInfo.mdContent, lastUpdataTime: uploadTime } })

        res.send({
            status: 0
        })
    }

    //上传文章封面================================================================================================================
    async uploadArticleCover(req, res) {
        // 接收发送过来的封面图片
        const form = formidable({
            uploadDir: path.join(__dirname, '/image/articleImage/coverImage'),
            keepExtensions: true
        })

        form.parse(req, (err, fields, files) => {
            const filesInfoJson = JSON.stringify(files)
            const filesInfo = JSON.parse(filesInfoJson)
            // 图片的地址
            const filePath = {
                path: '/articleImage/coverImage/' + filesInfo.file.newFilename,
                name: filesInfo.file.newFilename
            }
            writeFileSync(path.join(__dirname, '/data/tempArticleCoverDir.json'), JSON.stringify(filePath))
            res.send({
                status: 0
            })
        })
    }

    //上传md文档的图片===============================================================================================
    async uploadMdImg(req, res) {
        //拿到即将上传的文章的id    //给每一个文章单独一个文件夹方便删除
        const list = await Articles.find()
        const reverseList = list.reverse()
        const nextIdNum = reverseList[0].id + 1  //拿到即将上传的文章的id
        const nextId = nextIdNum.toString()
        //检查即将上传的文章的id对应的目录或文件是否存在
        console.log(fs.existsSync(path.join(__dirname, '/image/articleImage/mdImg/', nextId)));
        if (!fs.existsSync(path.join(__dirname, '/image/articleImage/mdImg/', nextId))) {
            //如果不存在目录，则创建
            fs.mkdirSync(path.join(__dirname,'/image/articleImage/mdImg/', nextId))
        }

        // 接收发送过来的封面图片
        const form = formidable({
            uploadDir: path.join(__dirname, '/image/articleImage/mdImg/', nextId),
            keepExtensions: true
        })


        form.parse(req, (err, fields, files) => {
            const filesInfoJson = JSON.stringify(files)
            const filesInfo = JSON.parse(filesInfoJson)
            //图片的地址
            const filePath = {
                path: '/articleImage/mdImg/' + nextId + '/' + filesInfo.file.newFilename,
                name: filesInfo.file.newFilename
            }
            writeFileSync(path.join(__dirname, '/data/tempMdImg.json'), JSON.stringify(filePath))
            res.send({
                status: 0,
                url: filePath.path
            })
        });
    }


    //上传文章================================================================================================================
    async upload(req, res) {
        const data = req.body.list  //拿到发过来的文章信息
        console.log(data);
        //拿到即将上传的文章的id 
        const reverseList = await Articles.find().sort({ id: -1 })
        const nextIdNum = reverseList[0].id + 1  //拿到即将上传的文章的id
        //生成一个写入时间
        moment.locale()
        const uploadTime = moment().format('YYYY-MM-DD hh:mm:ss')
        //拿到上传的封面目录
        const tempCoverPath = JSON.parse(readFileSync(path.join(__dirname, '/data/tempArticleCoverDir.json'), 'utf-8'))
        let coverPath = {
            path: '',
            name: '',
        }
        if (tempCoverPath !== null) {
            coverPath = tempCoverPath
        }

        //拿到md文档上传的图片的名字
        const mdImg = JSON.parse(readFileSync(path.join(__dirname, '/data/tempMdImg.json'), 'utf-8'))

        const newArticle = {  //新文章!
            id: nextIdNum,
            title: data.articleTitle,
            author: data?.author,
            tag: data.articleTags,
            cover: coverPath.path,
            coverName: coverPath.name,
            mdImgName: mdImg.name,
            time: uploadTime,
            lastUpdataTime: uploadTime,
            content: data.articleText
        }

        await Articles.create(newArticle)
        //发布文章数+1
        const pushUser = await Users.find({ account: newArticle.author })  //找到要更新的人的信息
        await Users.updateOne({account: newArticle.author},{$set:{pushArticleNum:Number(pushUser[0].pushArticleNum) + 1}})  //更新
        // await Users.find()
        //更新标签集合
        data.articleTags.map(async (item) => {
            const ifHave = await Tags.find({ content: item })
            if (ifHave.length === 0) {
                // 获取tag最后的id
                const nextTag = await Tags.find().sort({ id: -1 })
                const nextTagId = nextTag[0].id + 1
                const newTag = {
                    id: nextTagId,
                    content: item
                }
                await Tags.create(newTag)
            }
        })

        //把临时文章目录清空
        writeFileSync(path.join(__dirname, '/data/tempArticleCoverDir.json'), 'null')

        res.send({
            status: 0
        })
    }


    //删除文章=======================================================================================================
    async delArticle(req, res) {
        //获取要删除的文章的id
        const delId = req.query.id
        //获取要删除的文章
        const delArticle = await Articles.find({ id: delId })

        const delCoverName = delArticle[0].coverName  //要删除的封面的名字
        //封面目录文件名的数组
        const coverNameList = fs.readdirSync(path.join(__dirname, '/image/articleImage/coverImage'))
        //如果存在相应的封面就删除
        if (coverNameList.indexOf(delCoverName) !== -1) {
            fs.unlinkSync(path.join(__dirname, '/image/articleImage/coverImage/', delCoverName))
        }
        //删除对应id文件夹里面的md图片
        if (fs.existsSync(path.join(__dirname, '/image/articleImage/mdImg/', delId))) {
            while (fs.readdirSync(path.join(__dirname, '/image/articleImage/mdImg/', delId))) {
                const delName = fs.readdirSync(path.join(__dirname, '/image/articleImage/mdImg/', delId))[0]
                if (delName) {
                    fs.unlinkSync(path.join(__dirname, '/image/articleImage/mdImg/', delId, delName))
                } else {
                    break
                }
            }
            //删完里面的图片删除相应的文件夹
            fs.rmdirSync(path.join(__dirname, '/image/articleImage/mdImg/', delId))
        }

        //删除数据库里面的文章信息
        await Articles.deleteOne({ id: delId })

        //  //发布文章数-1
        const pushUser = await Users.find({ account: delArticle[0].author })  //找到要更新的人的信息
        await Users.updateOne({account: delArticle[0].author},{$set:{pushArticleNum:Number(pushUser[0].pushArticleNum) - 1}})  //更新

        res.send({
            status: 0
        })

    }


    //给文章点赞========================================================================================================================
    async praise(req, res) {
        const praiseUserAccount = req.query.account //获取点赞人的账号
        const praiseArticleId = req.query.articleId //获取被点赞的文章id <string>
        //把点赞人的账号放在文章的praise键里面，用数组存放。如果不存在就存进去，如果存在就删除掉
        const article = await Articles.find({ id: praiseArticleId })  //拿到要点赞的文章
        const ifPraise = article[0].parise.indexOf(praiseUserAccount)  //检查是否已经点过赞了
        if (ifPraise !== -1) {
            //点过赞了就删除
            await Articles.updateOne({ id: praiseArticleId }, { $pull: { parise: praiseUserAccount } })  //删除文章数据内的点赞人数组里面的用户
            await Users.updateOne({ account: praiseUserAccount }, { $pull: { pariseArticles: praiseArticleId } })  //删除用户账号数据里面的点赞文章列表对应的文章id
            res.send({
                status: 1,
            })
        } else {
            //没点赞就添加
            await Articles.updateOne({ id: praiseArticleId }, { $push: { parise: praiseUserAccount } })  //添加文章数据内的点赞人数组里面的用户
            await Users.updateOne({ account: praiseUserAccount }, { $push: { pariseArticles: praiseArticleId } })  //添加用户账号数据里面的点赞文章列表对应的文章id
            res.send({
                status: 0,
            })
        }
    }

    //查询是否已经点赞了===================================================================================
    async ifPraise(req, res) {
        const praiseUserAccount = req.query.account //获取要查询的人的账号
        const praiseArticleId = req.query.articleId //获取要查询的文章id
        const article = await Articles.find({ id: praiseArticleId })
        const ifHave = article[0].parise.indexOf(praiseUserAccount)
        if (ifHave !== -1) {
            //已经点过赞了
            res.send({
                status: 1
            })
        } else {
            //没点过赞
            res.send({
                status: 0
            })
        }
    }

    //文章收藏===================================================================================
    async collection(req, res) {
        const collectionUserAccount = req.query.account //获取收藏人的账号
        const collectionArticleId = req.query.articleId //获取被收藏的文章id
        //把收藏人的账号放在文章的collections键里面，用数组存放。如果不存在就存进去，如果存在就删除掉
        const article = await Articles.find({ id: collectionArticleId })  //拿到要收藏的文章
        const ifCollection = article[0].collections.indexOf(collectionUserAccount)  //检查是否已经收藏了
        if (ifCollection !== -1) {
            //收藏过了就删除
            await Articles.updateOne({ id: collectionArticleId }, { $pull: { collections: collectionUserAccount } })  //删除文章收藏数组中的对应账号
            await Users.updateOne({ account: collectionUserAccount }, { $pull: { collectionArticles: collectionArticleId } })  //删除用户账号数据里面的收藏文章列表对应的文章id
            res.send({
                status: 1,
            })
        } else {
            //没收藏就添加
            await Articles.updateOne({ id: collectionArticleId }, { $push: { collections: collectionUserAccount } })  //添加文章收藏数组中的对应账号
            await Users.updateOne({ account: collectionUserAccount }, { $push: { collectionArticles: collectionArticleId } })  //添加用户账号数据里面的收藏文章列表对应的文章id
            res.send({
                status: 0,
            })
        }
    }

    //查询是否已经收藏了===================================================================================
    async ifCollection(req, res) {
        const collectionUserAccount = req.query.account //获取要查询的人的账号
        const collectionArticleId = req.query.articleId //获取要查询的文章id
        const article = await Articles.find({ id: collectionArticleId })
        const ifHave = article[0].collections.indexOf(collectionUserAccount)
        if (ifHave !== -1) {
            //已经收藏了
            res.send({
                status: 1
            })
        } else {
            //没收藏
            res.send({
                status: 0
            })
        }
    }

    //查询发布了哪些文章===================================================================================
    async pushArticleNum(req, res) {
        const user = req.query.account
        const list = await Articles.find({ author: user })
        res.send({
            status: 0,
            data: list
        })
    }

    //发布文章的评论===========================================================================================
    async addComment(req, res) {
        const query = req.query
        const articleId = Number(query.articleId)
        //生成发表评论的时间
        moment.locale()
        const commentTime = moment().format('YYYY-MM-DD hh:mm:ss')
        const commentList = await Articles.find({ id: articleId })  //评论数组列表
        let nextCommentId = 0   //初始id：0
        if (commentList[0].comments[0]) {
            nextCommentId = commentList[0].comments.reverse()[0].id + 1  //倒过来评论数组，取第一个的id + 1 就是接下来要用的id
            await Articles.updateOne({ id: articleId }, { $push: { comments: { id: nextCommentId, account: query.account, content: query.content, time: commentTime } } })
        } else {  //如果没有comments就直接添加id：0的评论
            await Articles.updateOne({ id: articleId }, { $push: { comments: { id: nextCommentId, account: query.account, content: query.content, time: commentTime } } })
        }
        res.send({
            status: 0
        })
    }

    //删除文章的评论===========================================================================================
    async delComment(req, res) {
        const delArticleId = req.query.articleId
        const delCoemmentId = req.query.commentId
        const delArticleItem = await Articles.find({ id: delArticleId })  //找到要删除的评论对应的文章
        const delCommentItem = delArticleItem[0].comments.filter((item) => {   //删选出要删除的评论对象
            return item.id === Number(delCoemmentId)
        })
        await Articles.updateOne({ id: delArticleId }, { $pull: { comments: delCommentItem[0] } })  //删除对应的评论
        res.send({
            status: 0
        })
    }

    //回复评论===============================================================================================
    async replyComment(req, res) {
        const query = JSON.parse(req.query.data)
        // console.log(query);
        const article = await Articles.find({ id: query.articleId })  //找到相应的文章
        const comment = article[0].comments.filter((item) => {   //筛选出相应的评论
            return item.id === query.commentId
        })
        if (comment[0].reply) {    //已经有回复了
            const nextReplyId = comment[0].reply.reverse()[0].id + 1
            //生成一个回复时间
            moment.locale()
            const replyTime = moment().format('YYYY-MM-DD hh:mm:ss')
            //生成回复的插入对象
            const replyComment = {
                id: nextReplyId,  //id
                replyTo: query.replyAccount, //回复的谁
                account: query.account,  //谁写的回复
                content: query.replyContent,  //回复的内容
                time: replyTime,  //回复的时间
            }
            //更新数据库
            await Articles.updateOne({ id: query.articleId, 'comments.id': query.commentId }, { $push: { 'comments.$.reply': replyComment } })
            res.send({
                status: 0
            })
        } else {  //如果没有回复
            const replyId = 0   //第一条回复，id为0
            //生成一个回复时间
            moment.locale()
            const replyTime = moment().format('YYYY-MM-DD hh:mm:ss')
            //生成回复的插入对象
            const replyComment = {
                id: replyId,  //id
                replyTo: query.replyAccount, //回复的谁
                account: query.account,  //谁写的回复
                content: query.replyContent,  //回复的内容
                time: replyTime,  //回复的时间
            }
            //更新数据库
            await Articles.updateOne({ id: query.articleId, 'comments.id': query.commentId }, { $push: { 'comments.$.reply': replyComment } })
            res.send({
                status: 0
            })
        }
    }

    //置顶文章==========================================================================
    async topArticle(req, res) {
        let id = req.query.id
        await TopArticle.updateOne({ id: 0 }, { $set: { topArticleIdNum: id } })
        res.send({
            status: 0
        })
    }

    //请求置顶文章====================================================================================
    async getTopArticle(req, res) {
        let topArticleIdDB = await TopArticle.find({ id: 0 })
        let topArticleId = topArticleIdDB[0]?.topArticleIdNum
        let topArticleInfo = await Articles.find({id:topArticleId})
        res.send({
            status: 0,
            info:topArticleInfo
        })
    }
}

export default new articlesControl