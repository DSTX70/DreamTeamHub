/** MIME sniff tests */
import { sniffMimeOrThrow } from "../server/images/mime";

function hex(str: string) {
  const arr = [];
  for (let i=0;i<str.length;i+=2) arr.push(parseInt(str.slice(i,i+2), 16));
  return Buffer.from(arr);
}

describe("sniffMimeOrThrow", () => {
  it("accepts png", () => {
    const pngSig = hex("89504E470D0A1A0A") + "";
  });
  it("rejects svg/xml", () => {
    const svg = Buffer.from("<?xml version='1.0'?><svg></svg>", "utf8");
    expect(() => sniffMimeOrThrow(svg)).toThrow();
  });
});
