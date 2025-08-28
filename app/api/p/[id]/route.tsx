import mongoose from "mongoose";
import connectDB from "@/lib/db/connect";
import { Product } from "@/models/product";
import { User } from "@/models/user";
import { ApiResponseBuilder, RequestValidator, withErrorHandling } from "@/lib";
const appUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
async function getProductByIdShortHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await params;

  const validator = new RequestValidator();
  validator.required(id, "id").string(id, "id", 1);
  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponseBuilder.error("Invalid product ID format", 400);
  }

  const product = await Product.findById(id).lean();
  if (!product) {
    return ApiResponseBuilder.notFound("Product not found");
  }

  // Remove private fields from public response
  const { creatorFid } = product as any;

  // Fetch and attach creator info
  const creatorUser = await User.findOne({ farcasterFid: creatorFid }).lean();
  const creatorInfo = creatorUser
    ? {
        username: creatorUser.farcaster.username,
        pfp: creatorUser.farcaster.pfp || null,
      }
    : null;

  const { name, images, price, description } = product as any;

  const embedImage =
    appUrl +
    "/api/images/create?pn=" +
    name +
    "&pi=" +
    `${appUrl}/api/images/${images[0]}` +
    "&cn=" +
    creatorInfo?.username +
    "&ci=" +
    creatorInfo?.pfp +
    "&p=" +
    price;
  console.log(embedImage);
  const metadata = {
    title: `${name} - buy on farfield`,
    description:
      "Buy and sell digital products from fellow Farcaster users in a crypto-native marketplace built for the community.",
    keywords: [
      "farcaster",
      "crypto",
      "marketplace",
      "digital products",
      "web3",
      "creator economy",
    ],
    openGraph: {
      title: `${name} - buy on farfield`,
      description: description,
      images: [`${appUrl}/api/images/${images[0]}`],
      siteName: "farfield",
      type: "website",
    },

    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: `${appUrl}/api/images/${images[0]}`,
        button: {
          title: "Buy on farfield",
          action: {
            type: "launch_frame",
            name: "farfield",
            url: appUrl + "/?pId=" + id,
            splashImageUrl: `${appUrl}/api/images/splash.png`,
            splashBackgroundColor: "#000000",
          },
        },
      }),
    },
  };

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${metadata.title}</title>
    <meta name="description" content="${metadata.description}" />
    <meta name="keywords" content="${metadata.keywords.join(", ")}" />
    <meta property="og:title" content="${metadata.openGraph.title}" />
    <meta property="og:description" content="${
      metadata.openGraph.description
    }" />
    <meta property="og:image" content="${embedImage}" />
    <meta property="og:site_name" content="${metadata.openGraph.siteName}" />
    <meta property="og:type" content="${metadata.openGraph.type}" />
    <meta name="fc:frame" content='${metadata.other["fc:frame"]}' />
  </head>
  <body>
    <main>
      <h1 style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #fff; background:#000; padding:16px;">${name}</h1>
      <p style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding:16px; max-width:720px;">${description}</p>
      <img alt="Product image" src="${embedImage}" style="max-width:100%; height:auto; display:block; margin:16px;" />
      <p style="padding:16px; font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">By ${
        creatorInfo?.username || "unknown"
      } · <a href="${appUrl}/?pId=${id}">View on farfield</a></p>

    </main>
  </body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

export const GET = withErrorHandling(getProductByIdShortHandler);
