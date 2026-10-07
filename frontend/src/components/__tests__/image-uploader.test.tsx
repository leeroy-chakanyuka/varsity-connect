import { fireEvent, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ImageUploader } from "../ImageUploader";
import { renderWithSession } from "../../test-utils";

/* stateful harness, behaves like a parent form would */
function Harness({ initial = [] as string[], onChange = vi.fn() }: { initial?: string[]; onChange?: (urls: string[]) => void }) {
  const [urls, setUrls] = useState(initial);
  return (
    <ImageUploader
      value={urls}
      onChange={(next) => {
        setUrls(next);
        onChange(next);
      }}
    />
  );
}

function jpg(name = "photo.jpg", size = 4): File {
  return new File([new Uint8Array(size)], name, { type: "image/jpeg" });
}

describe("image uploader", () => {
  it("rejects unsupported types without uploading", async () => {
    const changed = vi.fn();
    renderWithSession(<Harness onChange={changed} />, "/");

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["x"], "notes.txt", { type: "text/plain" })] } });

    expect(await screen.findByRole("alert")).toHaveTextContent(/not a supported image/i);
    expect(changed).not.toHaveBeenCalled();
  });

  it("rejects oversized files", async () => {
    renderWithSession(<Harness />, "/");

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [jpg("big.jpg", 5 * 1024 * 1024 + 1)] } });

    expect(await screen.findByRole("alert")).toHaveTextContent(/exceeds 5 MB/i);
  });

  it("uploads and previews, then removes", async () => {
    const changed = vi.fn();
    renderWithSession(<Harness onChange={changed} />, "/", "student-token");

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [jpg()] } });

    expect(await screen.findByAltText("uploaded preview")).toBeInTheDocument();
    expect(changed).toHaveBeenCalledWith(["/uploads/listing/mock-photo.jpg"]);

    fireEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(changed).toHaveBeenCalledWith([]);
    expect(screen.queryByAltText("uploaded preview")).not.toBeInTheDocument();
  });

  it("respects the image cap", async () => {
    renderWithSession(
      <Harness initial={["/a.jpg", "/b.jpg", "/c.jpg", "/d.jpg", "/e.jpg"]} />,
      "/",
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [jpg()] } });

    expect(await screen.findByRole("alert")).toHaveTextContent(/at most 5 images/i);
  });
});
