import {
  embeddableURLValidator,
  getEmbedLink,
  maybeParseEmbedSrc,
} from "../src/embeddable";

describe("YouTube timestamp parsing", () => {
  it("should parse YouTube URLs with timestamp in seconds", () => {
    const testCases = [
      {
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=90",
        expectedStart: 90,
      },
      {
        url: "https://youtu.be/dQw4w9WgXcQ?t=120",
        expectedStart: 120,
      },
      {
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&start=150",
        expectedStart: 150,
      },
    ];

    testCases.forEach(({ url, expectedStart }) => {
      const result = getEmbedLink(url);
      expect(result).toBeTruthy();
      expect(result?.type).toBe("video");
      if (result?.type === "video" || result?.type === "generic") {
        expect(result.link).toContain(`start=${expectedStart}`);
      }
    });
  });

  it("should parse YouTube URLs with timestamp in time format", () => {
    const testCases = [
      {
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s",
        expectedStart: 90, // 1*60 + 30
      },
      {
        url: "https://youtu.be/dQw4w9WgXcQ?t=2m45s",
        expectedStart: 165, // 2*60 + 45
      },
      {
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1h2m3s",
        expectedStart: 3723, // 1*3600 + 2*60 + 3
      },
      {
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=45s",
        expectedStart: 45,
      },
      {
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5m",
        expectedStart: 300, // 5*60
      },
      {
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=2h",
        expectedStart: 7200, // 2*3600
      },
    ];

    testCases.forEach(({ url, expectedStart }) => {
      const result = getEmbedLink(url);
      expect(result).toBeTruthy();
      expect(result?.type).toBe("video");
      if (result?.type === "video" || result?.type === "generic") {
        expect(result.link).toContain(`start=${expectedStart}`);
      }
    });
  });

  it("should handle YouTube URLs without timestamps", () => {
    const testCases = [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    ];

    testCases.forEach((url) => {
      const result = getEmbedLink(url);
      expect(result).toBeTruthy();
      expect(result?.type).toBe("video");
      if (result?.type === "video" || result?.type === "generic") {
        expect(result.link).not.toContain("start=");
      }
    });
  });

  it("should handle YouTube shorts URLs with timestamps", () => {
    const url = "https://www.youtube.com/shorts/dQw4w9WgXcQ?t=30";
    const result = getEmbedLink(url);

    expect(result).toBeTruthy();
    expect(result?.type).toBe("video");
    if (result?.type === "video" || result?.type === "generic") {
      expect(result.link).toContain("start=30");
    }
    // Shorts should have portrait aspect ratio
    expect(result?.intrinsicSize).toEqual({ w: 315, h: 560 });
  });

  it("should handle playlist URLs with timestamps", () => {
    const url =
      "https://www.youtube.com/playlist?list=PLrAXtmRdnEQy1KbG5lbfgQ0-PKQY6FKYZ&t=60";
    const result = getEmbedLink(url);

    expect(result).toBeTruthy();
    expect(result?.type).toBe("video");
    if (result?.type === "video" || result?.type === "generic") {
      expect(result.link).toContain("start=60");
      expect(result.link).toContain("list=PLrAXtmRdnEQy1KbG5lbfgQ0-PKQY6FKYZ");
    }
  });

  it("should handle malformed or edge case timestamps", () => {
    const testCases = [
      {
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=abc",
        expectedStart: 0, // Invalid timestamp should default to 0
      },
      {
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=",
        expectedStart: 0, // Empty timestamp should default to 0
      },
      {
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=0",
        expectedStart: 0, // Zero timestamp should be handled
      },
    ];

    testCases.forEach(({ url, expectedStart }) => {
      const result = getEmbedLink(url);
      expect(result).toBeTruthy();
      expect(result?.type).toBe("video");
      if (result?.type === "video" || result?.type === "generic") {
        if (expectedStart === 0) {
          expect(result.link).not.toContain("start=");
        } else {
          expect(result.link).toContain(`start=${expectedStart}`);
        }
      }
    });
  });

  it("should preserve other URL parameters", () => {
    const url =
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=90&feature=youtu.be&list=PLtest";
    const result = getEmbedLink(url);

    expect(result).toBeTruthy();
    expect(result?.type).toBe("video");
    if (result?.type === "video" || result?.type === "generic") {
      expect(result.link).toContain("start=90");
      expect(result.link).toContain("enablejsapi=1");
    }
  });
});

describe("Google Drive video embedding", () => {
  it.each([
    {
      url: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz123456/view?usp=sharing",
      expectedLink:
        "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz123456/preview",
    },
    {
      url: "https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQrStUvWxYz123456",
      expectedLink:
        "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz123456/preview",
    },
    {
      url: "https://drive.google.com/uc?export=download&id=1AbCdEfGhIjKlMnOpQrStUvWxYz123456",
      expectedLink:
        "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz123456/preview",
    },
  ])("should normalize Google Drive link: $url", ({ url, expectedLink }) => {
    const result = getEmbedLink(url);

    expect(result).toBeTruthy();
    expect(result?.type).toBe("video");
    if (result?.type === "video" || result?.type === "generic") {
      expect(result.link).toBe(expectedLink);
    }
    expect(result?.intrinsicSize).toEqual({ w: 560, h: 315 });
  });

  it("should preserve resourcekey when available", () => {
    const url =
      "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz123456/view?resourcekey=0-abcdef123456";
    const result = getEmbedLink(url);

    expect(result).toBeTruthy();
    expect(result?.type).toBe("video");
    if (result?.type === "video" || result?.type === "generic") {
      expect(result.link).toBe(
        "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz123456/preview?resourcekey=0-abcdef123456",
      );
    }
  });

  it("should preserve timestamp when available", () => {
    const url =
      "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz123456/view?t=9";
    const result = getEmbedLink(url);

    expect(result).toBeTruthy();
    expect(result?.type).toBe("video");
    if (result?.type === "video" || result?.type === "generic") {
      expect(result.link).toBe(
        "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz123456/preview?t=9",
      );
    }
  });

  it("should preserve resourcekey and timestamp together", () => {
    const url =
      "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz123456/view?resourcekey=0-abcdef123456&t=9";
    const result = getEmbedLink(url);

    expect(result).toBeTruthy();
    expect(result?.type).toBe("video");
    if (result?.type === "video" || result?.type === "generic") {
      expect(result.link).toBe(
        "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz123456/preview?resourcekey=0-abcdef123456&t=9",
      );
    }
  });

  it("should validate Google Drive domain by default", () => {
    expect(
      embeddableURLValidator(
        "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz123456/view",
        undefined,
      ),
    ).toBe(true);
  });
});

describe("Instagram embedding", () => {
  it("should embed profile links", () => {
    const url = "https://www.instagram.com/pepezada/";
    const result = getEmbedLink(url);

    expect(result).toBeTruthy();
    expect(result?.type).toBe("generic");
    if (result?.type === "video" || result?.type === "generic") {
      expect(result.link).toBe("https://www.instagram.com/pepezada/embed");
      expect(result.intrinsicSize).toEqual({ w: 400, h: 700 });
    }
  });

  it("should embed post links", () => {
    const url = "https://www.instagram.com/p/DWCuAQjAPc0/";
    const result = getEmbedLink(url);

    expect(result).toBeTruthy();
    expect(result?.type).toBe("generic");
    if (result?.type === "video" || result?.type === "generic") {
      expect(result.link).toBe(
        "https://www.instagram.com/p/DWCuAQjAPc0/embed",
      );
      expect(result.intrinsicSize).toEqual({ w: 400, h: 480 });
    }
  });

  it("should validate instagram domain by default", () => {
    expect(
      embeddableURLValidator("https://www.instagram.com/pepezada/", undefined),
    ).toBe(true);
  });
});

describe("Twitter/X embedding", () => {
  it("should embed post links", () => {
    const url = "https://x.com/ennntropy/status/1757453315439222839";
    const result = getEmbedLink(url);

    expect(result).toBeTruthy();
    expect(result?.type).toBe("document");
    if (result?.type === "document") {
      expect(result.srcdoc("light")).toContain("twitter-tweet");
      expect(result.srcdoc("light")).toContain(
        "https://twitter.com/x/status/1757453315439222839",
      );
      expect(result.intrinsicSize).toEqual({ w: 480, h: 480 });
    }
  });
});

describe("Spotify embedding", () => {
  it("should embed intl track links", () => {
    const url = "https://open.spotify.com/intl-pt/track/4y93vvzu2h8MITw7YyUTcI";
    const result = getEmbedLink(url);

    expect(result).toBeTruthy();
    expect(result?.type).toBe("generic");
    if (result?.type === "video" || result?.type === "generic") {
      expect(result.link).toBe(
        "https://open.spotify.com/embed/track/4y93vvzu2h8MITw7YyUTcI",
      );
      expect(result.intrinsicSize).toEqual({ w: 400, h: 352 });
    }
  });

  it("should embed podcast episode links", () => {
    const url = "https://open.spotify.com/episode/2T6xWQ5tJbX4RldxgM3KxV";
    const result = getEmbedLink(url);

    expect(result).toBeTruthy();
    expect(result?.type).toBe("generic");
    if (result?.type === "video" || result?.type === "generic") {
      expect(result.link).toBe(
        "https://open.spotify.com/embed/episode/2T6xWQ5tJbX4RldxgM3KxV",
      );
      expect(result.intrinsicSize).toEqual({ w: 400, h: 352 });
    }
  });

  it("should validate spotify domain by default", () => {
    expect(
      embeddableURLValidator(
        "https://open.spotify.com/intl-pt/track/4y93vvzu2h8MITw7YyUTcI",
        undefined,
      ),
    ).toBe(true);
  });
});

describe("SoundCloud embedding", () => {
  it("should embed track links", () => {
    const url =
      "https://soundcloud.com/kitten-hvh/k0n3cz-stakillaz-ultra-slowed";
    const result = getEmbedLink(url);

    expect(result).toBeTruthy();
    expect(result?.type).toBe("generic");
    if (result?.type === "video" || result?.type === "generic") {
      expect(result.link).toBe(
        "https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/kitten-hvh/k0n3cz-stakillaz-ultra-slowed&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true",
      );
      expect(result.intrinsicSize).toEqual({ w: 560, h: 315 });
    }
  });

  it("should preserve official soundcloud player links", () => {
    const url =
      "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2188656335&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true";
    const result = getEmbedLink(url);

    expect(result).toBeTruthy();
    expect(result?.type).toBe("generic");
    if (result?.type === "video" || result?.type === "generic") {
      expect(result.link).toBe(url);
      expect(result.intrinsicSize).toEqual({ w: 560, h: 315 });
    }
  });

  it("should parse iframe snippets that include extra trailing html", () => {
    const snippet =
      '<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2188656335&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe><div style="font-size: 10px;">x</div>';

    expect(maybeParseEmbedSrc(snippet)).toBe(
      "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2188656335&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true",
    );
  });

  it("should validate soundcloud domain by default", () => {
    expect(
      embeddableURLValidator(
        "https://soundcloud.com/kitten-hvh/k0n3cz-stakillaz-ultra-slowed",
        undefined,
      ),
    ).toBe(true);
  });
});

describe("Google Maps embedding", () => {
  it("should convert maps query links to embed format", () => {
    const url = "https://www.google.com/maps?q=Av.+Paulista,+Sao+Paulo";
    const result = getEmbedLink(url);

    expect(result).toBeTruthy();
    expect(result?.type).toBe("generic");
    if (result?.type === "video" || result?.type === "generic") {
      expect(result.link).toBe(
        "https://www.google.com/maps?q=Av.%20Paulista%2C%20Sao%20Paulo&output=embed",
      );
      expect(result.intrinsicSize).toEqual({ w: 560, h: 420 });
    }
  });

  it("should keep existing maps embed links", () => {
    const url = "https://www.google.com/maps/embed?pb=testEmbedPayload";
    const result = getEmbedLink(url);

    expect(result).toBeTruthy();
    expect(result?.type).toBe("generic");
    if (result?.type === "video" || result?.type === "generic") {
      expect(result.link).toBe(url);
      expect(result.intrinsicSize).toEqual({ w: 560, h: 420 });
    }
  });

  it("should validate google maps domains by default", () => {
    expect(
      embeddableURLValidator(
        "https://www.google.com/maps?q=Av.+Paulista,+Sao+Paulo",
        undefined,
      ),
    ).toBe(true);

    expect(
      embeddableURLValidator(
        "https://maps.google.com/?q=Av.+Paulista,+Sao+Paulo",
        undefined,
      ),
    ).toBe(true);
  });
});
