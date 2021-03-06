var assert = require('assert')
  , Emitter = require('component-emitter')
  , Undoable = require('model-undoable')
  , React    = require('timoxley-react')


// Note: component/model-ish, emits class-level events

function TestModel(){
  this.attrs = {};
  this.dirty = {};
  return Emitter(this);
}

Emitter(TestModel);
TestModel.prototype.model = TestModel;

TestModel.prototype.set = function(attr,val){
  var prev = this.attrs[attr];
  this.dirty[attr] = val;
  this.attrs[attr] = val;
  this.model.emit('change',this,attr,val,prev);
  return this;
}

TestModel.prototype.get = function(attr){
  return this.attrs[attr];
}

TestModel.prototype.one = function(val){
  if (arguments.length == 0){
    return this.get("one");
  } else {
    return this.set("one",val);
  }
}

TestModel.prototype.two = function(val){
  if (arguments.length == 0){
    return this.get("two");
  } else {
    return this.set("two",val);
  }
}

TestModel.prototype.three = function(val){
  if (arguments.length == 0){
    return this.get("three");
  } else {
    return this.set("three",val);
  }
}

TestModel.prototype.save = function(){
  console.log("save: %o", this);
  this.dirty = {};
  this.model.emit('save',this);
  return this;
}

Undoable(TestModel);


/* for object mixin tests */

TestObject = function(){
  this.one = undefined
  this.two = undefined
  this.three = undefined
  this.save = function(){
    console.log("save: %o", this);
    this.emit('save');
    return this;
  }
  this.set = function(attr,val){
    this[attr] = val;
  }
  this.get = function(attr){
    return this[attr];
  }
  React(this);
  return this;
}

TestObject.prototype = new Emitter();



describe('model-undoable', function(){
  describe('undo', function(){
    
    beforeEach( function(){
      this.subject = new TestModel();
      this.subject.on('undo', function(attr,val){ 
        console.log("undo: %s <-- %s", attr,val); 
      });
      this.subject.on('redo', function(attr,val){ 
        console.log("redo: %s --> %s", attr,val); 
      });
    })

    // todo: spy on undo event
    it('should do nothing at point zero', function(){
      var subject = this.subject;
      subject.undo();
      var exp = undefined, act = subject.get("one");
      assert.equal(exp,act,"was " + act + " not " + exp);
    })

    it('should do nothing after save at point zero', function(){
      var subject = this.subject;
      subject.save();
      subject.undo();
      var exp = undefined, act = subject.get("one");
      assert.equal(exp,act,"was " + act + " not " + exp);
    })

    it('should undo to point zero', function(){
      var subject = this.subject;
      subject.set("one", 1);
      subject.undo();
      var exp = undefined, act = subject.get("one");
      assert.equal(exp,act,"was " + act + " not " + exp);
    })

    it('should reset dirty state', function(){
      var subject = this.subject;
      subject.set("one", 1);
      subject.set("one", 11);
      subject.undo();
      var exp = {"one": 1}, act = subject.dirty;
      assert.deepEqual(exp,act,"was " + act + " not " + exp);
    })

    it('should reset dirty state to point zero', function(){
      var subject = this.subject;
      subject.set("one", 1);
      subject.set("one", 11);
      subject.undo();
      subject.undo();
      var exp = {}, act = subject.dirty;
      assert.deepEqual(exp,act,"was " + act + " not " + exp);
    })

    it('should undo once', function(){
      var subject = this.subject;
      subject.set("one", 1);
      subject.set("one", 11);
      subject.set("one", 111);
      subject.undo();
      var exp = 11, act = subject.get("one");
      assert.equal(exp,act,"was " + act + " not " + exp);
    })

    it('should undo twice', function(){
      var subject = this.subject;
      subject.set("one", 1);
      subject.set("two", 2);
      subject.set("one", 11);
      subject.set("two", 22);
      subject.undo();
      subject.undo();
      var exp = 1, act = subject.get("one");
      assert.equal(exp,act,"was " + act + " not " + exp);
      exp = 2; act = subject.get("two");
      assert.equal(exp,act,"was " + act + " not " + exp);
    })

    it('should undo three times', function(){
      var subject = this.subject;
      subject.set("one", 1);
      subject.set("one", 11);
      subject.set("two", 2);
      subject.set("two", 22);
      subject.set("two", 222);
      subject.set("one", 111);
      subject.undo();
      subject.undo();
      subject.undo();
      var exp = 11, act = subject.get("one");
      assert.equal(exp,act,"was " + act + " not " + exp);
      exp = 2; act = subject.get("two");
      assert.equal(exp,act,"was " + act + " not " + exp);
    })

    it('should undo only back to the last save point', function(){
      var subject = this.subject;
      subject.set("one", 1);
      subject.set("two", 2);
      subject.set("one", 11);
      subject.save();
      subject.set("two", 22);
      subject.undo();
      subject.undo();
      var exp = 11, act = subject.get("one");
      assert.equal(exp,act,"was " + act + " not " + exp);
      exp = 2; act = subject.get("two");
      assert.equal(exp,act,"was " + act + " not " + exp);
    })

    it('should undoAll', function(){
      var subject = this.subject;
      subject.set("one", 1);
      subject.set("one", 11);
      subject.set("one", 111);
      subject.undoAll();
      var exp = undefined, act = subject.get("one");
      assert.equal(exp,act,"was " + act + " not " + exp);
    })
      
  })

  describe('redo', function(){
    
    beforeEach( function(){
      this.subject = new TestModel();
      this.subject.on('undo', function(attr,val){ 
        console.log("undo: %s <-- %s", attr,val); 
      });
      this.subject.on('redo', function(attr,val){ 
        console.log("redo: %s --> %s", attr,val); 
      });
    })

    // todo: spy on redo event
    it('should do nothing at point zero', function(){
      var subject = this.subject;
      subject.redo();
      var exp = undefined, act = subject.get("one");
      assert.equal(exp,act,"was " + act + " not " + exp);
    })

    it('should do nothing after save at point zero', function(){
      var subject = this.subject;
      subject.save();
      subject.redo();
      var exp = undefined, act = subject.get("one");
      assert.equal(exp,act,"was " + act + " not " + exp);
    })

    it('should redo up to the latest change', function(){
      var subject = this.subject;
      subject.set("one", 1);
      subject.redo();
      subject.redo();
      var exp = 1, act = subject.get("one");
      assert.equal(exp,act,"was " + act + " not " + exp);
    })

    it('should undo and then redo once', function(){
      var subject = this.subject;
      subject.set("one", 1);
      subject.set("one", 11);
      subject.set("one", 111);
      subject.undo();
      subject.redo();
      var exp = 111, act = subject.get("one");
      assert.equal(exp,act,"was " + act + " not " + exp);
    })

    it('should undo and then redo twice', function(){
      var subject = this.subject;
      subject.set("one", 1);
      subject.set("two", 2);
      subject.set("one", 11);
      subject.set("two", 22);
      subject.undo();
      subject.undo();
      subject.redo();
      subject.redo();
      var exp = 11, act = subject.get("one");
      assert.equal(exp,act,"was " + act + " not " + exp);
      exp = 22; act = subject.get("two");
      assert.equal(exp,act,"was " + act + " not " + exp);
    })

    it('should undo and redo three times in no particular order', function(){
      var subject = this.subject;
      subject.set("one", 1);
      subject.set("one", 11);
      subject.set("two", 2);
      subject.set("two", 22);
      subject.set("two", 222);
      subject.set("one", 111);
      subject.set("one", 1111);
      subject.set("two", 2222);
      subject.undo();
      subject.undo();
      subject.redo();
      subject.redo();
      subject.undo();
      subject.redo();
      var exp = 1111, act = subject.get("one");
      assert.equal(exp,act,"was " + act + " not " + exp);
      exp = 2222; act = subject.get("two");
      assert.equal(exp,act,"was " + act + " not " + exp);
    })

    // todo: spy on redo event
    it('should do nothing if change made after undo', function(){
      var subject = this.subject;
      subject.set("one", 1);
      subject.set("one", 11);
      subject.set("one", 111);
      subject.undo();
      subject.set("one", 1111);
      subject.redo();
      var exp = 1111, act = subject.get("one");
      assert.equal(exp,act,"was " + act + " not " + exp);
    })

    // todo: spy on redo event
    it('should redo changes ignoring undone branches', function(){
      var subject = this.subject;
      subject.set("one", 1);
      subject.set("one", 11);
      subject.set("one", 111);
      subject.undo();
      subject.undo();
      subject.set("one", 1111);
      subject.set("one", 11111);
      subject.undo();
      subject.undo();
      subject.redo();
      var exp = 1111, act = subject.get("one");
      assert.equal(exp,act,"was " + act + " not " + exp);
    })

    it('should redoAll', function(){
      var subject = this.subject;
      subject.set("one", 1);
      subject.set("one", 11);
      subject.set("two", 2);
      subject.set("two", 22);
      subject.undo();
      subject.undo();
      subject.undo();
      subject.redoAll();
      var exp = 11, act = subject.get("one");
      assert.equal(exp,act,"was " + act + " not " + exp);
      exp = 22; act = subject.get("two");
      assert.equal(exp,act,"was " + act + " not " + exp);
    })
      
  })

  describe('object mixin', function(){

    beforeEach( function(){
      this.subject = new TestObject();
      this.subject.undoCommand = function(it,attr,val){ this.set(attr,val); };
      this.subject.redoCommand = this.subject.undoCommand;
      Undoable(this.subject);
      this.subject.on('undo', function(attr,val){ 
        console.log("undo: %s <-- %s", attr,val); 
      });
      this.subject.on('redo', function(attr,val){ 
        console.log("redo: %s --> %s", attr,val); 
      });
    })

    it('should undo only back to the last save point', function(){
      var subject = this.subject;
      subject.set("one", 1);
      subject.set("two", 2);
      subject.set("one", 11);
      subject.save();
      subject.set("two", 22);
      subject.undo();
      subject.undo();
      var exp = 11, act = subject.get("one");
      assert.equal(exp,act,"was " + act + " not " + exp);
      exp = 2; act = subject.get("two");
      assert.equal(exp,act,"was " + act + " not " + exp);
    })

    it('should undoAll', function(){
      var subject = this.subject;
      subject.set("one", 1);
      subject.set("one", 11);
      subject.set("one", 111);
      subject.undoAll();
      var exp = undefined, act = subject.get("one");
      assert.equal(exp,act,"was " + act + " not " + exp);
    })
    
    it('should redo changes ignoring undone branches', function(){
      var subject = this.subject;
      subject.set("one", 1);
      subject.set("one", 11);
      subject.set("one", 111);
      subject.undo();
      subject.undo();
      subject.set("one", 1111);
      subject.set("one", 11111);
      subject.undo();
      subject.undo();
      subject.redo();
      var exp = 1111, act = subject.get("one");
      assert.equal(exp,act,"was " + act + " not " + exp);
    })

    it('should redoAll', function(){
      var subject = this.subject;
      subject.set("one", 1);
      subject.set("one", 11);
      subject.set("two", 2);
      subject.set("two", 22);
      subject.undo();
      subject.undo();
      subject.undo();
      subject.redoAll();
      var exp = 11, act = subject.get("one");
      assert.equal(exp,act,"was " + act + " not " + exp);
      exp = 22; act = subject.get("two");
      assert.equal(exp,act,"was " + act + " not " + exp);
    })
     
    it('should emit undo and redo exactly once per call', function(){
      var subject = this.subject;
      var n_undo = 0, n_redo = 0;
      subject.on('undo', function(){ n_undo++; });
      subject.on('redo', function(){ n_redo++; });
      subject.set("one", 1);
      subject.undo();
      subject.redo();
      var exp = 1, act = n_undo;
      assert.equal(exp,act,"was " + act + " not " + exp);
      var exp = 1, act = n_redo;
      assert.equal(exp,act,"was " + act + " not " + exp);
    })

  })


})



