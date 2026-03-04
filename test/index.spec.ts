/// <reference types="mocha" />
import { expect } from "chai";
import { hello } from "../src/tests/index.js";

describe("Typescript", () => {
  it("should return string correctly", () => {
    expect(hello("mocha")).to.equal("Hello mocha");
  });
});
