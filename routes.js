
module.exports = {

    helloString : "OK",
    helloFunction : (req,res) => { 
        res.end("helloFunction"); 
    },
    helloFunction2 : (req,res,opt) => {
        console.log(opt.post.c);
        if("a" in opt.post && "b" in opt.post) {
            res.end( "" + (parseInt(opt.post.a) + parseInt(opt.post.b)) );
        } else {
            res.end("'a' and 'b' required"); 
        }
    },
    helloObject : { a: "A" }

};