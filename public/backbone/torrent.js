var validators = {};
validators['required'] = {type: 'required', message: 'این فیلد الزامی است.'};

function onSubmitSignUpSubmit(){
    var that = this;
    name = this.$('input[name=new_name]').val();
    email = this.$('input[name=new_email]').val();
    password = this.$('input[name=new_password]').val();
    console.log(password);
    data = {
            "action": "user_signup",
            "form": {
                "name": name,
                "email": email,
                "password": password
            }
        };
    console.log(data);
        data_json = JSON.stringify(data);
        $.ajax({
            url: "/",
            data: {data: data_json},
            type: 'POST',
            success: function(data) {
                if(data.state=="fail"){
                    error = data.error.message;
                    alert(error);
                }
                else{
                }
            },
            error: function(data) {
                error = data.error.message;
                alert(error);
                that.errorSaving(data);
            }
        });
    $.fancybox.close();
};


var LoginStatus = Backbone.Model.extend({

    defaults: {
        loggedIn: false,
        username: null,
        password: null
    },

    onApiKeyChange: function (status, password) {
        this.set({'loggedIn': !!password});
    },

    logout: function() {
        this.set({'loggedIn': false});
    },

    login: function() {
        this.set({'loggedIn': true});
    },

    setusername: function(username) {
        this.set({'username': username});
    },

    setpassword: function(password) {
        this.set({'password': password});
    }

});

var AppView = Backbone.View.extend({

    _loggedInTemplate: _.template('<p>Welcome <%= escape(\'username\') %>!</p>\
        <button name="signout" id="signout" type="submit">signout</button>'),
    _notLoggedInTemplate: _.template('<form class="login-form">\
                            username: <input name="username" type="text" value="" />\
                            password: <input name="password" type="password" value="" />\
                            <button  type="submit">SignIn</button>\
                            <button name="signup" id="signup" type="submit">SignUp</button>\
                            <button name="signout" id="signout" type="submit">signout</button>\
        <p><%= escape(\'error\') %></p></form>'),

    initialize: function () {
        this.model.bind('change:loggedIn', this.render, this);
    },

    events: {
        'submit .login-form': 'onSignInSubmit',
        'click #signout':'onSignOutKey',
        'click #signup':'onSignUpKey'
    },

    onSignOutKey: function(e){
        var that = this;
        e.preventDefault();
        data = {
            "action": "user_signout"
        };
        data_json = JSON.stringify(data);
        $.ajax({
            url: "/",
            data: {data: data_json},
            type: 'POST',
            success: function(data) {
                that.model.logout();
            },
            error: function(data) {
                console.log(data);
                that.errorSaving(data);
            }
        });
    },

    onSignUpKey: function(e){
        $("#signup").fancybox({
            title : 'New User',
            padding : [20,20,20,20],
            content: 'Please Sign up:<br><br>\
                        <form class="signup-form" action="javascript:onSubmitSignUpSubmit();">\
                            Name &nbsp &nbsp &nbsp <input name="new_name" type="text" value="" /><br>\
                            Email &nbsp &nbsp &nbsp <input name="new_email" type="text" value="" /><br>\
                            Password <input name="new_password" type="password" value="" />\
                            <button name="signup-submit"  id="signup-submit" type="submit">ok</button></form>',
            maxWidth	: 800,
            maxHeight	: 600,
            fitToView	: true,
            width		: '50%',
            height		: '30%',
            autoSize	: false
        });
    },


    onSignInSubmit: function(e){
        var that = this;
        e.preventDefault();
        username = this.$('input[name=username]').val();
        password = this.$('input[name=password]').val();
        this.model.setusername(username);
        this.model.setpassword(password);
        data = {
            "action": "user_signin",
            "form": {
                "email": username,
                "password": password
            }
        };
        data_json = JSON.stringify(data);
        $.ajax({
            url: "/",
            data: {data: data_json},
            type: 'POST',
            success: function(data) {
                if(data.state=="fail"){
                    console.log(data.error.message);
                    error = data.error.message;
                    $(that.el).empty().html(that._notLoggedInTemplate(error));
                }
                else{
                    $(that.el).empty().html(that._loggedInTemplate());
                    that.model.login();
                }
            },
            error: function(data) {
                $(that.el).empty().html(that._notLoggedInTemplate(data));
                that.errorSaving(data);
            }
        });
    },

    render: function () {
        if (this.model.get('loggedIn')) {
            $(this.el).empty().html(this._loggedInTemplate(this.model));
        } else {
            $(this.el).empty().html(this._notLoggedInTemplate(this.model));
        }
        return this;
    }
});


var Torrent = Backbone.Model.extend({
    schema: {
        name: {type: 'Text', title: 'نام', validators: [validators.required]},
        category: {type: 'Text', title: 'دسته'},
        tags: {type: 'Text', title: 'برچسب ها'},
        upload_date: {type: 'Text', title: 'زمان آپلود'},
        seeder_count: {type:"Text", title: 'تعداد سیدرها'},
        leecher_count: {type:"Text", title: 'تعداد لیچرها'},
        comment_count: {type:"Text", title: 'تعداد کامنتها'},
        like_count: {type:"Text", title: 'تعداد لایک'},
        dislike_count: {type:"Text", title: 'تعداد نفرت'}
    }
});

var torrent_FormCollection = Backbone.Collection.extend({
    model: Torrent
});

var TorrentsView = Backbone.View.extend({

    tagName: 'table class=torrents',

    template:_.template('\
                    <button id="load" class="yekan btn btn-primary">اضافه</button>\
        '),


    render: function(){
        this.collection.each(function(torrent){
            var torrentView = new TorrentView({ model: torrent });
            this.$el.append(torrentView.render().el)
        }, this);
        this.$el.append(this.template());
        return this; // returning this for chaining..
    },

    events: {
        'click button#load': 'load'
    },

    load: function() {
        var that = this;
        data = {
            'action': "torrent_list",
            'form': {
                "search_text": "sad"}
                            };
        data_json = JSON.stringify(data);
            $.ajax({
                url: "/",
                data: {data: data_json},
                type: 'POST',
                success: function(data) {
                    console.log(data);
                },
                error: function(data) {
                    console.log(data);
                    that.errorSaving(data);
                }
            });
    }

});

var TorrentView = Backbone.View.extend({
    tagName: "tr",
    template: _.template('\
                        <td ><%= name %></td>\
                        <td><%= category %></td>\
                        <td><%= tags %></td>\
                        <td><%= upload_date %></td>\
                        <td><%= seeder_count %></td>\
        '),
    render: function(){
        this.$el.html( this.template(this.model.toJSON()));
        return this;  // returning this from render method..
    }
});

var formCollection = null;
$(document).ready(function() {

    var view = new AppView({model: new LoginStatus()});
    $(document.body).append(view.render().el);


    formCollection = new torrent_FormCollection([
        {
            name: 'The Shining',
            category: "trailer",
            tags: ["ss","fwfq"],
            upload_date : "sad",
            seeder_count: "dw"
        },
        {
            name: 'Rahul Nag',
            category: "trler",
            tags: ["s"],
            upload_date : "dq",
            seeder_count: "xcww"
        }]);
    var torrentView = new TorrentsView({ collection: formCollection});
    $(document.body).append(torrentView.render().el);

//    window.App = {
//        Models: {},
//        Collections: {},
//        Views: {},
//        Router: {}
//    };
//
//    App.Router = Backbone.Router.extend({
//        routes: {
//            '': 'index',
//            'show/:id': 'show',
//            'download/*random': 'download',
//            'search/:query': 'search',
//            '*other': 'default'
//        },
//
//        index: function() {
//            $(document.body).append("Index route has been called..");
//        },
//
//        show: function(id) {
//            $(document.body).append("Show route has been called.. with id equals : " + id);
//        },
//
//        download: function(random) {
//            $(document.body).append("download route has been called.. with random equals : " + random);
//        },
//
//        search: function(query) {
//            $(document.body).append("Search route has been called.. with query equals : " + query);
//        }
//
//    });
//
//    new App.Router;
//    Backbone.history.start();
});


