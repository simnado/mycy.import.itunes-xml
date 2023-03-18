import { PullParser } from "https://deno.land/x/xmlp/mod.ts";

type Field = {
  key?: string;
  type?: string;
  value?: any | Field[];
};

export class ItunesParser {
  out = {};
  // fields build by key type and value
  currentField: Field = { key: "root" };
  // items build by multiple fields
  currentItem = this.out;
  currentItemParents: any[] = [this.out];

  createKey() {
    this.currentField = {};
  }

  createArray() {
    const newArray: any[] = [];
    const arrayKey = this.currentField.key as string;
    const oldChild = this.currentItemParents.at(-1);
    oldChild[arrayKey] = newArray;
    this.currentItemParents.push(newArray);
    this.currentItem = newArray;
  }

  createDict() {
    const newDict = {};
    const dictKey = this.currentField.key as string;
    const oldChild = this.currentItemParents.at(-1);
    if (Array.isArray(oldChild)) {
      oldChild.push(newDict);
    } else {
      oldChild[dictKey] = newDict;
    }
    this.currentItemParents.push(newDict);
    this.currentItem = newDict;
  }

  closeField(type: string) {
    let value = this.currentField.value;
    switch (type) {
      case "string":
      case "data":
        break;
      case "integer":
        value = Number(value);
        break;
      case "date":
        value = new Date(value);
        break;
      case "true":
        value = true;
        break;
      case "false":
        value = false;
        break;
      default:
        throw new Error("unknow type " + type);
    }

    Object.assign(this.currentItem, {
      [this.currentField.key as string]: value,
    });
    this.currentField = {};
  }

  closeArray() {
    this.currentItemParents.pop();
  }

  closeDict() {
    this.currentItemParents.pop();
  }

  async processFile(path: string) {
    const parser = new PullParser();

    // create an ES6 generator
    const uint8Array = await Deno.readFile(path);
    const events = parser.parse(uint8Array);

    let i = 0;

    for (const node of events) {
      switch (node.name) {
        case "processing_instruction":
        case "doctype":
        case "start_document":
          break;
        case "start_element":
          if (node.element?.qName === "array") {
            this.createArray();
          } else if (node.element?.qName === "dict") {
            this.createDict();
          } else if (node.element?.qName === "key") {
            this.createKey();
          } else if (this.currentField) {
            this.currentField.type = node.element?.qName;
          }
          break;
        case "end_element":
          if (node.element?.qName === "array") {
            this.closeArray();
          } else if (node.element?.qName === "dict") {
            this.closeDict();
          } else if (!["dict", "key", "plist"].includes(node.element?.qName)) {
            this.closeField(node.element?.qName);
          }
          break;
        case "text":
          if (this.currentField.key && this.currentField.type) {
            this.currentField.value = node.text;
          } else {
            this.currentField.key = node.text;
          }
          break;
        default:
          console.warn(node);
      }

      i++;
    }

    console.log(`processed ${i} lines`);
    return this.out;
  }
}
