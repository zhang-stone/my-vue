export class myVue {
  constructor(config) {
    this.template = document.querySelector(config.el);
    this.data = reactive(config.data);
    
    for (let name in config.methods) {
      this[name] = () => {
        config.methods[name].apply(this.data)
      }
    }
    
    
    this.traversal(this.template);
  }
  traversal(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.trim().match(/^{{([\s\S]+)}}$/)) {
        let name = RegExp.$1.trim()
        console.log(name)
        console.log(this.data[name])
        effect(() => node.textContent = this.data[name]);
      }
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      let attributes = node.attributes;
      for (let attribute of attributes) {
        if (attribute.name === "v-model") {
          // console.log(attribute, attribute.value)
          let name = attribute.value;
          effect(() => node.value = this.data[name])
          node.addEventListener('input', () => {
            this.data[name] = node.value
          })
        }
        
        if (attribute.name.match(/^v-bind:([\s\S]+)/)) {
          // console.log(attribute, attribute.value)
          let attrName = RegExp.$1;
          let name = attribute.value;
          // console.log('attrName', attrName)
          effect(() => node.setAttribute(attrName, this.data[name]))
        }
        if (attribute.name.match(/^v-on:([\s\S]+)/)) {
          let eventName = RegExp.$1;
          let name = attribute.value;
          // console.log(eventName, name)
          node.addEventListener(eventName, this[name])
          
        }
      }
    } 
    
    if (node.childNodes && node.childNodes.length) {
      for (let child of node.childNodes) {
        this.traversal(child)
      }
    }
  }
}


const effects = new Map();
let currentEffect = null;

function effect(fn) {
  currentEffect = fn;
  fn()
  currentEffect = null;
}


function reactive(object) {
  const observed = new Proxy(object, {
    get(object, property) {
      if (currentEffect) {
        if (!effects.has(object)) {
          effects.set(object, new Map())
        }
        if (!effects.get(object).has(property)) {
          effects.get(object).set(property, new Array)
        }
        effects.get(object).get(property).push(currentEffect)

      }
      return object[property];

    },
    set(object, property, value) {
      object[property] = value;
      if (effects.has(object) && effects.get(object).has(property)) {
        for (let effect of effects.get(object).get(property)) {
          effect()
        }
      }
      return value;
    }
  })
  return observed;
}


let dummy
const counter = reactive({ num: 0 })
effect(() => (dummy = counter.num))


let dummy2
const counter2 = reactive({ num: 0 })
effect(() => (dummy2 = counter2.num))

counter.num = 9;
counter2.num = 9;
