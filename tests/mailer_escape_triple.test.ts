/**
 * Test: HTML escaping vs unescaped triple-brace
 * Validates {{var}} escapes and {{{var}}} doesn't escape
 */

import { renderTxEmailFromFile } from "../server/lib/mailer";
import fs from "fs";
import path from "path";

describe("Mailer - Escape vs Triple-Brace", () => {
  const testDir = path.join(process.cwd(), "tests/fixtures/escape");
  
  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });
  
  afterAll(() => {
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.readdirSync(testDir).forEach(file => {
        fs.unlinkSync(path.join(testDir, file));
      });
      fs.rmdirSync(testDir);
    }
  });
  
  it("should escape HTML in {{var}}", () => {
    const template = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>{{userName}}</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    
    const templatePath = path.join(testDir, "test_escape.mjml");
    fs.writeFileSync(templatePath, template);
    
    const html = renderTxEmailFromFile(templatePath, {
      userName: '<script>alert("xss")</script>',
    });
    
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&quot;xss&quot;');
    expect(html).not.toContain('<script>alert("xss")</script>');
    
    fs.unlinkSync(templatePath);
  });
  
  it("should not escape HTML in {{{var}}}", () => {
    const template = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-image src="{{{imageUrl}}}" />
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    
    const templatePath = path.join(testDir, "test_unescaped.mjml");
    fs.writeFileSync(templatePath, template);
    
    const imageUrl = "https://example.com/image.jpg?size=large&quality=high";
    const html = renderTxEmailFromFile(templatePath, { imageUrl });
    
    expect(html).toContain(imageUrl);
    expect(html).not.toContain('&amp;');
    
    fs.unlinkSync(templatePath);
  });
  
  it("should handle both {{var}} and {{{var}}} in loops", () => {
    const template = `
      <mjml>
        <mj-body>
          {{#each items}}
          <mj-section>
            <mj-column>
              <mj-image src="{{{url}}}" />
              <mj-text>{{name}}</mj-text>
            </mj-column>
          </mj-section>
          {{/each}}
        </mj-body>
      </mjml>
    `;
    
    const templatePath = path.join(testDir, "test_loop.mjml");
    fs.writeFileSync(templatePath, template);
    
    const html = renderTxEmailFromFile(templatePath, {
      items: [
        { url: "https://example.com/p1.jpg?w=640", name: "Product <b>A</b>" },
        { url: "https://example.com/p2.jpg?w=640", name: "Product <b>B</b>" },
      ],
    });
    
    // URLs should be unescaped
    expect(html).toContain("https://example.com/p1.jpg?w=640");
    expect(html).toContain("https://example.com/p2.jpg?w=640");
    
    // Names should be escaped
    expect(html).toContain("Product &lt;b&gt;A&lt;/b&gt;");
    expect(html).toContain("Product &lt;b&gt;B&lt;/b&gt;");
    
    fs.unlinkSync(templatePath);
  });
});
