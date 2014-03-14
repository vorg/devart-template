  define([], function() {
    var cache = {};

    function settings() {
      return {
        init : function(gui) {
          settings.gui = gui;
          return this;
        },
        getFloat : function(name, defaultValue, min, max) {
          min = min || 0;
          max = max || 1;
          var o = cache[name];
          if (!o) {
            o = { value : defaultValue };
            o.control = settings.gui.addParam(name, o, "value", {min:min, max:max}, function() { o.dirty = true; });
            cache[name] = o;
          }
          return o.control.getValue();
        },
        getInt : function(name, defaultValue, min, max) {
          return Math.floor(this.getFloat(name, defaultValue, min, max));
        },
        getBool: function(name, defaultValue) {
          var o = cache[name];
          if (!o) {
            o = { value : defaultValue };
            o.control = settings.gui.addParam(name, o, "value", {}, function() { o.dirty = true; });
            cache[name] = o;
          }
          return o.control.getValue();
        },
        isDirty: function() {
          var dirty = false;
          for(var paramName in cache) {
            if (cache[paramName].dirty) {
              dirty = true;
              cache[paramName].dirty = false;
            }
          }
          return dirty;
        }
      };
    }

    return settings;
  });
