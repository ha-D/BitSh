var validators = {};
validators['required'] = {type:'required', message:'این فیلد الزامی است.'};

function onSubmitSignUpSubmit() {
    var that = this;
    name = this.$('input[name=new_name]').val();
    email = this.$('input[name=new_email]').val();
    password = this.$('input[name=new_password]').val();
    console.log(password);
    data = {
        "action":"user_signup",
        "form":{
            "name":name,
            "email":email,
            "password":password
        }
    };
    console.log(data);
    data_json = JSON.stringify(data);
    $.ajax({
        url:"/",
        data:{data:data_json},
        type:'POST',
        success:function (data) {
            if (data.state == "fail") {
                error = data.error.message;
                alert(error);
            }
            else {
            }
        },
        error:function (data) {
            error = data.error.message;
            alert(error);
            that.errorSaving(data);
        }
    });
    $.fancybox.close();
}
;


var LoginStatus = Backbone.Model.extend({

    defaults:{
        loggedIn:false,
        username:null,
        password:null
    },

    onApiKeyChange:function (status, password) {
        this.set({'loggedIn':!!password});
    },

    logout:function () {
        this.set({'loggedIn':false});
    },

    login:function () {
        this.set({'loggedIn':true});
    },

    setusername:function (username) {
        this.set({'username':username});
    },

    setpassword:function (password) {
        this.set({'password':password});
    }

});

var UserView = Backbone.View.extend({

    _loggedInTemplate:_.template('<p>Welcome <%= escape(\'username\') %>!</p>\
        <input class="btn btn-primary btn-sm" style="clear: left;  height: 30px; font-size: 12px;" id="signout" type="submit" name="signout" value="Sign Out"/>'),
    _notLoggedInTemplate:_.template(
        '<form class="login-form">\
            <div class="form-group">\
                <input type="email" style="margin-bottom: 10px;" class="form-control" placeholder="Email" name="username">\
                <input id="password" style="margin-bottom: 10px;" type="password" class="form-control" placeholder="password" name="password"/>\
            </div>\
            <input id="remember_me" style="float: left; margin-right: 10px;" type="checkbox" name="user[remember_me]" value="1"/>\
            <label class="string optional" for="remember_me"> Remember me</label><br>\
            <input class="btn btn-primary btn-block" style="clear: left;  height: 30px; font-size: 12px;" type="submit" name="commit" value="Sign In"/>\
            <small>Don\'t have an account?</small>\
            <input class="btn btn-success btn-block" style="clear: left; height: 30px; font-size: 12px;" type="submit" name="signup" id="signup" value="Sign up"/></form>'),

    initialize:function () {
        this.model.bind('change:loggedIn', this.render, this);
    },

    events:{
        'submit .login-form':'onSignInSubmit',
        'click #signout':'onSignOutKey',
        'click #signup':'onSignUpKey'
    },

    onSignOutKey:function (e) {
        var that = this;
        e.preventDefault();
        data = {
            "action":"user_signout"
        };
        data_json = JSON.stringify(data);
        $.ajax({
            url:"/",
            data:{data:data_json},
            type:'POST',
            success:function (data) {
                that.model.logout();
            },
            error:function (data) {
//                console.log(data);
                that.errorSaving(data);
            }
        });
    },

    onSignUpKey:function (e) {
        $("#signup").fancybox({
            title:'New User',
            padding:[20, 20, 20, 20],
            content:'Please Sign up:<br><br>\
                        <form class="signup-form" action="javascript:onSubmitSignUpSubmit();">\
                            Name &nbsp &nbsp &nbsp <input name="new_name" type="text" value="" /><br>\
                            Email &nbsp &nbsp &nbsp <input name="new_email" type="text" value="" /><br>\
                            Password <input name="new_password" type="password" value="" />\
                            <button name="signup-submit"  id="signup-submit" type="submit">ok</button></form>',
            maxWidth:800,
            maxHeight:600,
            fitToView:true,
            width:'50%',
            height:'30%',
            autoSize:false
        });
    },


    onSignInSubmit:function (e) {
        var that = this;
        e.preventDefault();
        username = this.$('input[name=username]').val();
        password = this.$('input[name=password]').val();
        this.model.setusername(username);
        this.model.setpassword(password);
        data = {
            "action":"user_signin",
            "form":{
                "email":username,
                "password":password
            }
        };
        data_json = JSON.stringify(data);
        console.log(data);
        $.ajax({
            url:"/",
            data:{data:data_json},
            type:'POST',
            success:function (data) {
                if (data.state == "fail") {
//                    console.log(data.error.message);
                    error = data.error.message;
                    $(that.el).empty().html(that._notLoggedInTemplate(error));
                }
                else {
                    $(that.el).empty().html(that._loggedInTemplate());
                    that.model.login();
                }
            },
            error:function (data) {
                $(that.el).empty().html(that._notLoggedInTemplate(data));
                that.errorSaving(data);
            }
        });
    },

    render:function () {
        if (this.model.get('loggedIn')) {
            $(this.el).empty().html(this._loggedInTemplate(this.model));
        } else {
            $(this.el).empty().html(this._notLoggedInTemplate(this.model));
        }
        return this;
    }
});


var Torrent = Backbone.Model.extend({
    schema:{
        name:{type:'Text', title:'نام', validators:[validators.required]},
        category:{type:'Text', title:'دسته'},
        tags:{type:'Text', title:'برچسب ها'},
        upload_date:{type:'Text', title:'زمان آپلود'},
        seeder_count:{type:"Text", title:'تعداد سیدرها'},
        leecher_count:{type:"Text", title:'تعداد لیچرها'},
        comment_count:{type:"Text", title:'تعداد کامنتها'},
        like_count:{type:"Text", title:'تعداد لایک'},
        dislike_count:{type:"Text", title:'تعداد نفرت'}
    }
});

var torrent_FormCollection = Backbone.Collection.extend({
    model:Torrent
});

var TorrentsView = Backbone.View.extend({

    tagName:'table class=torrents',

    template:_.template('<button id="load" class="yekan btn btn-primary">Load</button>'),

    render:function () {
        this.collection.each(function (torrent) {
            var torrentView = new TorrentView({ model:torrent });
            this.$el.append(torrentView.render().el)
        }, this);
        this.$el.append(this.template());
        return this; // returning this for chaining..
    },

    events:{
        'click button#load':'load'
    },

    load:function () {
        var that = this;
        data = {
            'action':"torrent_list",
            'form':{
                "search_text":"sad"}
        };
        data_json = JSON.stringify(data);
        $.ajax({
            url:"/",
            data:{data:data_json},
            type:'POST',
            success:function (data) {
                console.log(data);
            },
            error:function (data) {
                console.log(data);
                that.errorSaving(data);
            }
        });
    }
});

var TorrentView = Backbone.View.extend({
    tagName:"tr",
    template:_.template('<td><a href="#download/1" class="tor"><%= name %></a>\
                        <p style="display: NONE;">\
                        category: <%= category %> - \
                        tags: <%= tags %> - \
                        upload date: <%= upload_date %> - \
                        seeder count: <%= seeder_count %></p></td>'),

    render: function () {
        this.$el.html(this.template(this.model.toJSON()));
        return this;  // returning this from render method..
    }
});

var formCollection = null;
$(document).ready(function () {
    

    formCollection = new torrent_FormCollection([
        {
            name:'The Shining',
            category:"movie",
            tags:["funny", "trailer"],
            upload_date:"2013/11/12",
            seeder_count:"25"
        },
        {
            name:'Breaking Bad',
            category:"Serial",
            tags:["fantastic"],
            upload_date:"2013/10/26",
            seeder_count:"149"
        }
    ]);
    var torrentView = new TorrentsView({ collection:formCollection});
    $(".table").append(torrentView.render().el);

    var view = new UserView({model:new LoginStatus()});
    $(".login-menu").append(view.render().el);

    window.App = {
        Models: {},
        Collections: {},
        Views: {},
        Router: {}
    };

    App.Router = Backbone.Router.extend({
        routes: {
            '': 'index',
            'download/:id': 'download',
            'search/:query': 'search',
            '*other': 'default'
        },

        index: function() {
            $(document.body).append("Index route has been called..");
        },

        download: function(id) {
            $(document.body).append("download route has been called.. torrent id : " + id);
        },

        search: function(query) {
            $(document.body).append("Search route has been called.. with query equals : " + query);
        }

    });

    new App.Router;
    Backbone.history.start();
});


