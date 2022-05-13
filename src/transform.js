import { Parser } from 'htmlparser2'
import { DomHandler } from 'domhandler'
function transformStr(str) {
  return str.trim().replace(/(for\s{0,}\(.*;.*)(<.*\).*)/g, (e, r, q) => `${r} < ${q.slice(1)}`).replace(/<([0-9])/g, '< $1');
}
function parseVnode(str) {
  let result;
  const handler = new DomHandler((error, dom) => {
    if (error);
    else {
      // Parsing completed, do something
      result = dom;
    }
  });
  const parser = new Parser(handler, {
    lowerCaseAttributeNames: false,
    xmlMode: true
  });
  function whitespace(c) {
    return c === ' ' || c === '\n' || c === '\t' || c === '\f' || c === '\r';
  }
  function isASCIIAlpha(c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
  }
  parser.tokenizer.__proto__.isTagStartChar = function (c) {
    return (isASCIIAlpha(c) ||
      (this.xmlMode && !whitespace(c) && c !== '/' && c !== '>' && c !== "'" && c !== '"' && c !== '`' && c !== '$' && c !== '='));
  };
  parser.write(transformStr(str));
  parser.end();
  return result;
}

function addId(vnode, id = -1, pid = -1, allId = []) {
  return vnode.map((child, index) => {
    if (child.type !== 'comment' && child.type !== 'text') {
      if (!originTag.includes(child.name)) {
        child._id_ = id === -1 ? index : id + index + 1;
        while (allId.includes(child._id_)) {
          child._id_ = child._id_ * 2;
        }
        child._pid_ = pid === -1 ? index : pid;
        allId.push(child._id_);
        addId(child.children, vnode.length + child._id_, child._id_, allId);
      }
      else {
        addId(child.children, id + vnode.length + index * 100, pid);
      }
    }
    return child;
  });
}

/*
 * @Author: Simon
 * @Date: 2022-04-02 15:41:54
 * @LastEditTime: 2022-04-07 09:19:10
 * @FilePath: \saas-fe-titan-tag-transform\src\parser\common\config.ts
 */
const originTag = ['view', 'swiper', 'swiper-item', 'scroll-view', 'cover-view', 'cover-image', 'movable-view', 'movable-area', 'text', 'icon', 'progress', 'rich-text', 'button', 'form', 'label', 'input', 'textarea', 'radio', 'radio-group', 'checkbox', 'checkbox-group', 'switch', 'slider', 'picker-view', 'picker-view-column', 'picker', 'navigator', 'image', 'video', 'lottie', 'canvas', 'map', 'web-view', 'lifestyle', 'contact-button', 'error-view', 'aria-component', 'page-meta', 'slot', 'block', 'template', 'import-sjs', 'import', 'span', 'i', 'div', 'p', 'include', 'article', 'page-meta'];
const whitelist = ['add-global-class', 'ext-class'];

/*
 * @Author: Simon
 * @Date: 2022-04-02 14:36:31
 * @LastEditTime: 2022-04-19 18:05:12
 * @FilePath: \saas-fe-titan-tag-transform\src\parser\common\externalClass.ts
 */
let externalClasses = [];
function transformWhitelistProps(props, key) {
  whitelist.forEach(_class => {
    props[key] = props[key].replace(setClassReg(_class), `{{${transformClass(_class)}}}`);
  });
}
function transformClass(_class) {
  return _class.split('-').reduce((a, b, i) => i > 0 ? (a + b[0].toUpperCase() + b.slice(1)) : a + b, '');
}
function setClassReg(_class) {
  return new RegExp(`(?<=^|\\s)(${_class})(?=$|\\s)`, 'g');
}
function replaceExternalClass(props) {
  Object.keys(props).forEach(key => {
    externalClasses.forEach(_class_ => {
      const _class = _class_.trim();
      if (props[key].indexOf(_class) !== -1) {
        props[key] = props[key].replace(setClassReg(_class), `{{${transformClass(_class)}}}`);
      }
    });
    transformWhitelistProps(props, key);
  });
  return props;
}

/*
 * @Author: Simon
 * @Date: 2022-02-28 11:24:20
 * @LastEditTime: 2022-04-22 10:17:59
 * @FilePath: \saas-fe-titan-tag-transform\src\parser\aliParser.ts
 */
function parserProps$3(_props = {}, child, filters = []) {
  const strProps = [];
  const props = replaceExternalClass(_props);
  Object.keys(props).forEach(key => {
    if (!/(on|catch)[A-Z]/.test(key)) {
      const oldValue = props[key];
      key = key.replace(/([a-z1-9]+)([A-Z])/g, (e, r, q) => {
        delete props[key];
        return `${r}-${q.toLocaleLowerCase()}`;
      });
      props[key] = oldValue;
    }
    if (key.startsWith('on__')) {
      const oldValue = props[key];
      key = key.replace(/on__(.*)/, (e, r) => {
        delete props[key];
        return `onHH${r}`;
      });
      props[key] = oldValue;
    }
    const reg = /\$(slots|root)/g;
    const value = props[key];
    if (reg.test(value)) {
      props[key] = value.replace(reg, 'S$1');
    }
    if (props[key] === '' && key !== 'a:key' && !filters.includes(key)) {
      strProps.push(`${key}`);
    }
    else {
      if (key === 'src' && child.name === 'import' && !(props[key].startsWith('/') || props[key].startsWith('.'))) {
        props[key] = './' + props[key];
      }
      if (key === 'from' && child.name === 'import-sjs' && !(props[key].startsWith('/') || props[key].startsWith('.'))) {
        props[key] = './' + props[key];
      }
      if (key === 'class') {
        props[key] = props[key].replace(/\s{0,}\{\{\s{0,}(\[.*\])\s{0,}\}\}/g, (e, r) => {
          return e.replace(r, r + '.join(" ")');
        });
      }
      if (!filters.includes(key)) {
        strProps.push(`${key}="${props[key].replace(/"/g, "'")}"`);
      }
    }
  });
  return strProps.join(' ');
}
function aliParserAST(vnode = []) {
  vnode = addId(vnode);
  return dfs(vnode);
  function dfs(vnode) {
    const strHtml = [];
    vnode.forEach(child => {
      if (!child || child.type === 'comment') {
        return;
      }
      child.attribs = child.attribs || {};
      if (child.name === 'span' || child.name === 'i') {
        child.name = 'text';
      }
      if (child.name === 'div' || child.name === 'p') {
        child.name = 'view';
      }
      if (child.type === 'text') {
        return strHtml.push(`${child.data.replace(/(?<=\{\{.*?)\$root/gms, 'Sroot')}`);
      }
      if (child.name === 'import-sjs' || child.name === 'import' || child.name === 'include') {
        return strHtml.push(`<${child.name} ${parserProps$3(child.attribs, child)} />`);
      }
      return originTag.includes(child.name)
        ? strHtml.push(`<${child.name} ${parserProps$3(child.attribs, child)}>${dfs(child.children)}</${child.name}>`)
        : strHtml.push(`<text${Object.keys(child.attribs).length > 0 ? ' ' + parserProps$3(child.attribs, child) : ''}><${child.name} ${parserProps$3(child.attribs, child, ['a:else', 'a:elif', 'a:if', 'a:for', 'a:key', 'a:for-item'])} data-_key_="${child._id_}" data-_pkey_="${child._pid_}" data-_pageId_={{$id}}>${dfs(child.children)}</${child.name}></text>`);
    });
    return strHtml.join('');
  }
}
function aliParserString(str) {
  return parseVnode(str);
}

function parserProps$2(props = {}, child, filters = []) {
  const strProps = [];
  const reg = /bind:?click$/;
  Object.keys(props).forEach(key => {
    if (reg.test(key)) {
      const value = props[key];
      const oldKey = key;
      key = 'bind:_click';
      props[key] = value;
      delete props[oldKey];
    }
    const uniAppClickTag = '^click';
    if (key === 'data-event-opts' && props[key].indexOf(uniAppClickTag)) {
      props[key] = props[key].replace(uniAppClickTag, '^_click');
    }
    const BINDEVENT = /bind|catch/;
    if (props[key] === '' && (key === 'xhs:else' || key === 'slot') && !filters.includes(key)) {
      strProps.push(`${key}`);
    }
    else if (props[key] === '' && key !== 'class' && key !== 'id' && key !== 'xhs:key' && !BINDEVENT.test(key) && key !== 'alt' && key !== 'xhs:if') {
      strProps.push(`${key}="{{true}}"`);
    }
    else {
      if (key === 'src' && child.name === 'import' && !(props[key].startsWith('/') || props[key].startsWith('.'))) {
        props[key] = './' + props[key];
      }
      if (key === 'from' && child.name === 'import-sjs' && !(props[key].startsWith('/') || props[key].startsWith('.'))) {
        props[key] = './' + props[key];
      }
      if (!filters.includes(key)) {
        strProps.push(`${key}="${props[key].replace(/"/g, "'")}"`);
      }
    }
  });
  return strProps.join(' ');
}
function xhsParserAST(vnode) {
  vnode = addId(vnode);
  return dfs(vnode);
  function dfs(vnode) {
    const strHtml = [];
    vnode.forEach(child => {
      if (child && child.type !== 'comment') {
        if (child.type === 'text') {
          strHtml.push(`${child.data}`);
        }
        else if (child.name === 'import-sjs' || child.name === 'import' || child.name === 'include') {
          if (child.attribs.src && child.attribs.src.startsWith('/')) {
            child.attribs.src = child.attribs.src;
          }
          strHtml.push(`<${child.name} ${parserProps$2(child.attribs, child)} />`);
        }
        else {
          if (originTag.includes(child.name)) {
            strHtml.push(`<${child.name} ${parserProps$2(child.attribs, child)}>${dfs(child.children)}</${child.name}>`);
          }
          else {
            strHtml.push(`<${child.name} ${parserProps$2(child.attribs, child)} data-_key_="${child._id_}" data-_pkey_="${child._pid_}" >${dfs(child.children)}</${child.name}>`);
          }
        }
      }
    });
    return strHtml.join('');
  }
}
/**
 * @description 将字符串解析成 AST
 * @export
 * @param str
 */
function xhsParserString(str) {
  return parseVnode(str);
}

function parserProps$1(props = {}, child, filters = []) {
  const strProps = [];
  Object.keys(props).forEach(key => {
    if (props[key] === '' && key !== 'trackBy' && !filters.includes(key)) {
      strProps.push(`${key}`);
    }
    else {
      if (key === 'src' && child.name === 'import' && !(props[key].startsWith('/') || props[key].startsWith('.'))) {
        props[key] = './' + props[key];
      }
      if (key === 'from' && child.name === 'import-sjs' && !(props[key].startsWith('/') || props[key].startsWith('.'))) {
        props[key] = './' + props[key];
      }
      if (!filters.includes(key)) {
        strProps.push(`${key}="${props[key].replace(/"/g, "'")}"`);
      }
    }
  });
  return strProps.join(' ');
}
function transformTagName(s) {
  return s.replace(/_/g, '-');
}
function baiduParserAST(vnode = []) {
  vnode = addId(vnode);
  return dfs(vnode);
  function dfs(vnode) {
    const strHtml = [];
    vnode.forEach(child => {
      if (child && child.type !== 'comment') {
        if (child.type === 'text') {
          strHtml.push(`${child.data}`);
        }
        else if (child.name === 'import' || child.name === 'include') {
          strHtml.push(`<${child.name} ${parserProps$1(child.attribs, child)} />`);
        }
        else {
          if (originTag.includes(child.name)) {
            strHtml.push(`<${child.name} ${parserProps$1(child.attribs, child)}>${dfs(child.children)}</${child.name}>`);
          }
          else {
            child.name = transformTagName(child.name);
            strHtml.push(`<${child.name} ${parserProps$1(child.attribs, child)} data-_key_=${child._id_} data-_pkey_=${child._pid_} >${dfs(child.children)}</${child.name}>`);
          }
        }
      }
    });
    return strHtml.join('');
  }
}
/**
 * @description 将字符串解析成 AST
 * @export
 * @param str
 */
function baiduParserString(str) {
  return parseVnode(str);
}

function parserProps(props = {}, child, filters = []) {
  const strProps = [];
  // const reg = /bind:?click$/
  Object.keys(props).forEach(key => {
    // if (reg.test(key)) {
    //   const value = props[key]
    //   const oldKey = key
    //   key = 'bind:_click'
    //   props[key] = value
    //   delete props[oldKey]
    // }
    const uniAppClickTag = '^click';
    if (key === 'data-event-opts' && props[key].indexOf(uniAppClickTag)) {
      props[key] = props[key].replace(uniAppClickTag, '^_click');
    }
    if (key === 'slot' && props[key]) {
      props[key] = props[key].replace(/[-_](\w)/g, (e, r) => {
        const result = r[0].toUpperCase() + r.slice(1);
        return result;
      });
    }
    if (props[key] === '' && !filters.includes(key)) {
      strProps.push(`${key}`);
    }
    else {
      if (key === 'src' && child.name === 'import' && !(props[key].startsWith('/') || props[key].startsWith('.'))) {
        props[key] = './' + props[key];
      }
      if (key === 'from' && child.name === 'import-sjs' && !(props[key].startsWith('/') || props[key].startsWith('.'))) {
        props[key] = './' + props[key];
      }
      if (key === 'class') {
        props[key] = props[key].replace(/\s{0,}\{\{\s{0,}(\[.*\])\s{0,}\}\}/g, (e, r) => {
          return e.replace(r, r + '.join(" ")');
        });
      }
      if (!filters.includes(key)) {
        strProps.push(`${key}="${props[key].replace(/"/g, "'")}"`);
      }
    }
  });
  return strProps.join(' ');
}
function ksParserAST(vnode = []) {
  vnode = addId(vnode);
  return dfs(vnode);
  function dfs(vnode) {
    const strHtml = [];
    vnode.forEach(child => {
      if (child && child.type !== 'comment') {
        if (child.type === 'text') {
          strHtml.push(`${child.data}`);
        }
        else if (child.name === 'import-sjs' || child.name === 'import' || child.name === 'include') {
          strHtml.push(`<${child.name} ${parserProps(child.attribs, child)} />`);
        }
        else {
          if (originTag.includes(child.name)) {
            strHtml.push(`<${child.name} ${parserProps(child.attribs, child)}>${dfs(child.children)}</${child.name}>`);
          }
          else {
            strHtml.push(`<${child.name} ${parserProps(child.attribs, child)} data-_key_="${child._id_}" data-_pkey_="${child._pid_}" >${dfs(child.children)}</${child.name}>`);
          }
        }
      }
    });
    return strHtml.join('');
  }
}
function ksParserString(str) {
  return parseVnode(str);
}

function keyConvert$3(key) {
  return key
    .replace(/wx:/i, 'a:')
    .replace(/a:for-items/i, 'a:for')
    .replace(/formType/i, 'form-type')
    .replace(/canvas-id/i, 'id')
    .replace(/bind:?[\w]+/gi, function (e, r) {
      return e
        .replace(/bindscrolltolower/gi, 'bindScrollToLower')
        .replace(/bindscrolltoupper/gi, 'bindScrollToUpper')
        .replace(/bind:?(\w)/g, (e, r) => ['on', r.toUpperCase()].join(''));
    })
    .replace(/onTouch(start|end|move|cancel)/g, (e, r) => e.replace(r, r.substring(0, 1).toUpperCase() + r.substring(1)))
    .replace(/catch[\w]+/gi, function (e, r) {
      if (e === 'catchtouchstart') {
        return 'catchTouchStart';
      }
      if (e === 'catchtouchmove') {
        return 'catchTouchMove';
      }
      if (e === 'catchtouchend') {
        return 'catchTouchEnd';
      }
      if (e === 'catchtouchcancel') {
        return 'catchTouchCancel';
      }
      if (e === 'catchtap') {
        return 'catchTap';
      }
      if (e === 'catchlongtap') {
        return 'catchLongTap';
      }
      if (e === 'catchsubmit') {
        return 'onSubmit';
      }
      if (e === 'catchreset') {
        return 'onReset';
      }
      return e.replace(/catch(\w)/g, (e, r) => ['catch', r.toUpperCase()].join(''));
    }).replace(/catch:(\w+)/g, (e, r) => {
      if (r === 'touchstart') {
        return 'catchTouchStart';
      }
      if (r === 'touchmove') {
        return 'catchTouchMove';
      }
      if (r === 'touchend') {
        return 'catchTouchEnd';
      }
      if (r === 'touchcancel') {
        return 'catchTouchCancel';
      }
      if (r === 'tap') {
        return 'catchTap';
      }
      if (r === 'longtap') {
        return 'catchLongTap';
      }
      return 'catch' + r[0].toUpperCase() + r.slice(1);
    });
}
function valueConvert(value) {
  return value
    .replace(/({{([\s\S]*)}})/gi, function (e, r) {
      return e.replace('{{', '').replace('}}', '');
    });
}

const eventNames = {
  bindtap: 'onTap',
  bindchange: 'onChange',
  bindscale: 'onScale',
  htouchmove: 'catchTouchMove',
  vtouchmove: 'onTouchMove',
  bindtransition: 'onTransition',
  bindanimationfinish: 'onAnimationEnd',
  binderror: 'onError',
  bindsubmit: 'onSubmit',
  bindreset: 'onReset',
  bindinput: 'onInput',
  bindfocus: 'onFocus',
  bindblur: 'onBlur',
  bindconfirm: 'onConfirm',
  bindchanging: 'onChanging',
  bindlinechange: 'onLineChange',
  bindsuccess: 'onSuccess',
  bindfail: 'onFail',
  bindcomplete: 'onComplete',
  bindplay: 'onPlay',
  bindpause: 'onPause',
  bindtimeupdate: 'onTimeUpdate',
  bindended: 'onEnded',
  bindload: 'onLoad',
  bindfullscreenchange: 'onFullScreenChange',
  bindloadedmetadata: 'onLoadedMetadata',
  bindmarkertap: 'onMarkerTap',
  bindcallouttap: 'onCalloutTap',
  bindcontroltap: 'onControlTap',
  bindregionchange: 'onRegionChange',
  bindtouchstart: 'onTouchStart',
  bindtouchmove: 'onTouchMove',
  bindtouchend: 'onTouchEnd',
  bindtouchcancel: 'onTouchCancel',
  bindlongtap: 'onLongTap',
  bindmessage: 'onMessage',
  bindscroll: 'onScroll',
  binddragstart: 'onTouchStart',
  binddragging: 'onTouchMove',
  binddragend: 'onTouchEnd',
  bindscrolltoupper: 'onScrollToUpper',
  bindscrolltolower: 'onScrollToLower'
};
function transformProps$3(props = {}) {
  const newProps = {};
  Object.keys(props).forEach((key, index) => {
    const propsKey = keyConvert$3(key); // key转换
    let propsValue = props[key];
    if (key.includes(':for-item') || key.includes(':for-index') || key.includes(':key')) {
      propsValue = valueConvert(props[key]); // value转换
    }
    // newProps[key.replace(/wx:/i, 'a:')] = props[key]
    newProps[propsKey] = propsValue;
    if (eventNames[key]) {
      newProps[eventNames[key]] = props[key];
      delete newProps[key];
    }
  });
  return newProps;
}

function transformSpecialTag(tag) {
  return function (vnode) {
    if (vnode.attribs.src) {
      vnode.attribs.src = vnode.attribs.src.replace('.wxml', tag);
    }
    return vnode;
  };
}

function transformWXS(name, source) {
  return function (vnode) {
    vnode.name = 'import-sjs';
    const { module, src } = vnode.attribs;
    if (name !== 'module') {
      vnode.attribs[name] = module;
      delete vnode.attribs.module;
    }
    if (src === undefined) {
      return vnode;
    }
    if (source !== 'src') {
      vnode.attribs[source] = src;
      delete vnode.attribs.src;
    }
    vnode.attribs[source] = vnode.attribs[source].replace('.wxs', '.sjs');
    return vnode;
  };
}

const ALIPAYTAG = '.axml';
const XHSTAG = '.xhsml';
const BDTAG = '.swan';
const KSTAG = '.ksml';

// <import-sjs name="m1" from="./index.sjs"/>
const transformAlipayWxs = transformWXS('name', 'from');
// <import-sjs src="../utils.sjs" module="utils" />
const transformBdWxs = transformWXS('module', 'src');
const transformAlipayTag = transformSpecialTag(ALIPAYTAG);
const transformXhsTag = transformSpecialTag(XHSTAG);
const transformBdTag = transformSpecialTag(BDTAG);
const transformKsTag = transformSpecialTag(KSTAG);

function transformToAlipay(vnode) {
  return transformVnode$3(vnode);
}
function transformVnode$3(vnode) {
  if (!vnode)
    return [];
  return vnode.map(child => {
    if (child.name) {
      child.name = child.name.toLowerCase();
    } // 标签驼峰转中划线（-）
    if (child.name === 'wxs') {
      child = transformAlipayWxs(child);
    }
    if (['include', 'import'].indexOf(child.name) > -1) {
      child = transformAlipayTag(child);
    }
    child.attribs = transformProps$3(child.attribs);
    if (child.children && child.children.length > 0) {
      child.children = transformToAlipay(child.children);
    }
    return child;
  });
}

function keyConvert$2(key) {
  return key
    .replace(/wx:/i, 'xhs:')
    .replace(/xhs:for-item/i, 'xhs:for-item')
    .replace(/formType/i, 'form-type')
    .replace(/canvas-id/i, 'id');
}

function transformProps$2(props, child) {
  const newProps = {};
  Object.keys(props).forEach((key) => {
    const propsKey = keyConvert$2(key); // key转换
    const propsValue = props[key];
    newProps[propsKey] = propsValue;
  });
  return newProps;
}

function transformToXhs(vnode) {
  return transformVnode$2(vnode);
}
function transformVnode$2(vnode) {
  if (!vnode)
    return [];
  return vnode.map(child => {
    if (child.type !== 'text' && child.type !== 'comment') {
      if (['include', 'import'].indexOf(child.name) > -1) {
        child = transformXhsTag(child);
      }
      child.attribs = transformProps$2(child.attribs);
    }
    if (child.children && child.children.length > 0) {
      child.children = transformVnode$2(child.children);
    }
    return child;
  });
}

function keyConvert$1(key) {
  return key
    .replace(/wx:key/i, 'trackBy')
    .replace(/wx:/i, 's-')
    .replace(/wx:for-item/i, 's-for-item')
    .replace(/formType/i, 'form-type')
    .replace(/canvas-id/i, 'id');
}

function transformProps$1(props, child) {
  const newProps = {};
  Object.keys(props).forEach((key) => {
    const propsKey = keyConvert$1(key); // key转换
    const propsValue = props[key];
    newProps[propsKey] = propsValue;
  });
  return newProps;
}

function transformToBaidu(vnode) {
  return transformVnode$1(vnode);
}
function transformVnode$1(vnode) {
  if (!vnode)
    return [];
  return vnode.map(child => {
    if (child.type !== 'text' && child.type !== 'comment') {
      child.name = child.name.toLowerCase();
      if (child.name === 'wxs') {
        child = transformBdWxs(child);
      }
      if (['include', 'import'].indexOf(child.name) > -1) {
        child = transformBdTag(child);
      }
      child.attribs = transformProps$1(child.attribs);
    }
    if (child.children && child.children.length > 0) {
      child.children = transformToBaidu(child.children);
    }
    return child;
  });
}

function keyConvert(key) {
  return key
    .replace(/wx:/i, 'ks:')
    .replace(/^:(\S)/i, '$1');
}

function transformProps(props, tagName) {
  const newProps = {};
  Object.keys(props).forEach((key) => {
    const propsKey = keyConvert(key); // key转换
    const propsValue = props[key];
    newProps[propsKey] = propsValue;
  });
  return newProps;
}

function transformToKS(vnode) {
  return transformVnode(vnode);
}
function transformVnode(vnode) {
  if (!vnode)
    return [];
  return vnode.map(child => {
    if (child.type !== 'text' && child.type !== 'comment') {
      if (['include', 'import'].indexOf(child.name) > -1) {
        child = transformKsTag(child);
      }
      if (child.name === 'slot' && child.attribs.name) {
        child.attribs.name = child.attribs.name.replace(/[-_](\w)/g, (e, r) => {
          const result = r[0].toUpperCase() + r.slice(1);
          return result;
        });
      }
      child.attribs = transformProps(child.attribs, child.name);
    }
    if (child.children && child.children.length > 0) {
      child.children = transformToKS(child.children);
    }
    return child;
  });
}

/*
 * @Author: Simon
 * @Date: 2022-02-21 16:45:38
 * @LastEditTime: 2022-04-02 15:33:16
 * @FilePath: \saas-fe-titan-tag-transform\src\index.ts
 */
class Transform {
  /**
   * @description 转到支付宝平台
   * @param content
   * @returns
   */
  toAlipay(content) {
    return aliParserAST(transformToAlipay(aliParserString(content)));
  }
  /**
   * @description 转到微信平台
   * @param content
   * @returns
   */
  toWX(content) {
    return '待实现';
  }
  /**
   * @description 转到百度平台
   * @param content
   * @returns
   */
  toBaidu(content) {
    return baiduParserAST(transformToBaidu(baiduParserString(content)));
  }
  /**
   * @description 转到小红书平台
   * @param content
   * @returns
   */
  toXhs(content) {
    return xhsParserAST(transformToXhs(xhsParserString(content)));
  }
  toKS(content, filePath) {
    // @ts-ignore
    return ksParserAST(transformToKS(ksParserString(content)));
  }
}
const transform = new Transform();

export { transform };
