import db from "../connection/db";

type Comment = {
    id: number,
    account: string,
    time: string,
    content: string
}

const Articles = db.model('articles', {
    id: {
        type: Number,
        required: true
    }, title: {
        type: String,
        required: true
    }, author: {
        type: String,
        required: false,
        default: 'noName',
    }, head: {    //不知道是什么，不敢删除
        type: String,
        required: false
    }, tag: {    //标签
        type: Array<string>,
        required: true
    }, parise: {   //点赞列表
        type: Array<string>,
        required: true
    }, collections: {   //收藏列表
        type: Array<string>,
        required: true
    }, cover: {
        type: String,
        required: false
    }, coverName: {
        type: String,
        required: false
    }, mdImgName: {
        type: String,
        required: false
    }, time: {
        type: String,
        required: true
    }, lastUpdataTime: {
        type: String,
        required: true
    }, oneSentence: {
        type: String,
        required: true
    }, content: {   //内容
        type: String,
        required: true
    }, comments: {  //评论
        type: Array<Comment>,
        required: false
    }
})

export default Articles