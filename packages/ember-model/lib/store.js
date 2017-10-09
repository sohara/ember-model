function NIL() {}

Ember.Model.Store = Ember.Service.extend({

  modelFor: function(type) {
    var owner = Ember.getOwner(this);
    var Factory = owner.factoryFor('model:'+type);
    return Factory.class;
  },

  adapterFor: function(type) {
    var adapter = this.modelFor(type).adapter,
        owner = Ember.getOwner(this);
    var serializer = this.serializerFor(type);
    if (adapter && adapter.constructor !== Ember.Adapter) {
      adapter.set('serializer', serializer);
      return adapter;
    } else {
      adapter = owner.factoryFor('adapter:'+ type) ||
        owner.factoryFor('adapter:application') ||
        Ember.RESTAdapter;

      return adapter ? adapter.create({serializer:serializer}) : adapter;
    }
  },

  serializerFor: function(type) {
    var owner = Ember.getOwner(this);
    var serializer = owner.factoryFor('serializer:'+ type) ||
      owner.factoryFor('serializer:application') ||
      Ember.JSONSerializer;

    return serializer ? serializer.create() : serializer;
  },

  createRecord: function(type, props) {
    var klass = this.modelFor(type);
    var owner = Ember.getOwner(this);
    klass.reopenClass({adapter: this.adapterFor(type)});
    var record = klass.create(owner.ownerInjection(), props);
    return record;
  },

  find: function(type, id) {
    if (arguments.length === 1) { id = NIL; }
    return this._find(type, id, true);
  },

  _find: function(type, id, async) {
    var klass = this.modelFor(type);

    // if (!klass.adapter) {
      klass.reopenClass({adapter: this.adapterFor(type)});
    // }

    var owner = Ember.getOwner(this);
    if (id === NIL) {
      return klass._findFetchAll(async, owner);
    } else if (Ember.isArray(id)) {
      return klass._findFetchMany(id, async, owner);
    } else if (typeof id === 'object') {
      return klass._findFetchQuery(id, async, owner);
    } else {
      return klass._findFetchById(id, async, owner);
    }
  },

  _findSync: function(type, id) {
    return this._find(type, id, false);
  }
});

Ember.onLoad('Ember.Application', function(Application) {

  Application.initializer({
    name: "store",

    initialize: function() {
      var application = arguments[1] || arguments[0];
      var store = application.Store || Ember.Model.Store;
      application.register('service:store', store);

      application.inject('route', 'store', 'service:store');
      application.inject('controller', 'store', 'service:store');
    }
  });

});
