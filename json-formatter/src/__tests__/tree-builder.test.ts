import { buildTree } from "@/lib/tree-builder";

describe("buildTree", () => {
  it("builds a single root node for a primitive value", () => {
    const node = buildTree("hello");
    expect(node.type).toBe("string");
    expect(node.value).toBe("hello");
    expect(node.key).toBe("$");
    expect(node.path).toBe("$");
    expect(node.children).toBeUndefined();
  });

  it("object produces child nodes with key labels", () => {
    const node = buildTree({ foo: 1, bar: 2 });
    expect(node.type).toBe("object");
    expect(node.children).toHaveLength(2);
    expect(node.children![0].key).toBe("foo");
    expect(node.children![1].key).toBe("bar");
  });

  it("array produces child nodes with index labels", () => {
    const node = buildTree([10, 20, 30]);
    expect(node.type).toBe("array");
    expect(node.children).toHaveLength(3);
    expect(node.children![0].key).toBe("[0]");
    expect(node.children![1].key).toBe("[1]");
    expect(node.children![2].key).toBe("[2]");
  });

  it("nested structures produce correct parent-child hierarchy", () => {
    const node = buildTree({ a: { b: [1] } });
    expect(node.type).toBe("object");
    const aNode = node.children![0];
    expect(aNode.key).toBe("a");
    expect(aNode.type).toBe("object");
    const bNode = aNode.children![0];
    expect(bNode.key).toBe("b");
    expect(bNode.type).toBe("array");
    expect(bNode.children![0].type).toBe("number");
  });

  it("each node includes the correct type tag", () => {
    const node = buildTree({
      s: "text",
      n: 42,
      b: true,
      nu: null,
      o: {},
      a: [],
    });
    const types = node.children!.map((c) => c.type);
    expect(types).toEqual(["string", "number", "boolean", "null", "object", "array"]);
  });

  it("generates correct JSON paths", () => {
    const node = buildTree({ foo: { bar: [{ baz: 1 }] } });
    const fooNode = node.children![0];
    expect(fooNode.path).toBe("$.foo");
    const barNode = fooNode.children![0];
    expect(barNode.path).toBe("$.foo.bar");
    const firstElem = barNode.children![0];
    expect(firstElem.path).toBe("$.foo.bar[0]");
    const bazNode = firstElem.children![0];
    expect(bazNode.path).toBe("$.foo.bar[0].baz");
  });
});
