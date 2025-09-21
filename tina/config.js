import { defineConfig } from "tinacms";

// Your hosting provider likely exposes this as an environment variable
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  branch,

  // Get this from tina.io
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  // Get this from tina.io
  token: process.env.TINA_TOKEN,

  build: {
    outputFolder: "admin",
    publicFolder: "static",
  },
  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "static",
    },
  },
  // See docs on content modeling for more info on how to setup new content models: https://tina.io/docs/schema/
  schema: {
    collections: [
      {
        name: "review",
        label: "Reviews",
        path: "content/review",
        defaultItem: {
          Title: "SPN-SSEE [AUTO]",
          OverallScore: 0,
          cover: {
            image: "/episodeImages/SPN-SSEE.jpg[AUTO]",
            alt: "Cover Photo of <SPN-Episode Name> [AUTO]"
          },
          body: {
            type: "root",
            children: [
              {
                type: "h2",
                children: [
                  { type: "text", text: "The Story, Briefly" },
                ],
              },
              {
                type: "p",
                children: [
                  { type: "text", text: "Lorem Ipsum Dolor Sit Amet, try not to exceed 250 characters." },
                ],
              },
              {
                type: "p",
                children: [
                  { type: "text", text: "Name of the episode:", bold: true },
                ],
              },
              {
                type: "p",
                children: [
                  { type: "text", text: "Describe the story of the name" },
                ],
              },
              {
                type: "h2",
                children: [
                  { type: "text", text: "Thoughts" },
                ],
              },
              {
                type: "p",
                children: [
                  { type: "text", text: "Intro" },
                ],
              },
              {
                type: "ul",
                children: [
                  {
                    type: "li",
                    children: [
                      {
                        type: "p",
                        children: [{ type: "text", text: "Point 1" }],
                      },
                    ],
                  },
                  {
                    type: "li",
                    children: [
                      {
                        type: "p",
                        children: [{ type: "text", text: "Point 2" }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        }
        ,
        ui: {
          filename: {
            readonly: true,
            slugify: (values) => {
              return values?.SpinoffCode + "-" + ("0" + values?.Season).slice(-2) + ("0" + values?.Episode).slice(-2)
            },
          },
          beforeSubmit: async ({
            form,
            cms,
            values,
          }) => {
            return {
              ...values,
              cover: {
                image: "/episodeImages/" + values.SpinoffCode + "-" + ("0" + values?.Season).slice(-2) + ("0" + values?.Episode).slice(-2) + ".jpg",
                alt: "Cover Photo of " + values.SpinoffCode + " " + ("0" + values?.Season).slice(-2) + ("0" + values?.Episode).slice(-2) + " " + values.EpisodeName
              },
              OverallScore: Number((values.StarTrekValues * values.Inspiring * values.StoryDevelopment / (5 * 5 * 5) * 100).toFixed(2)),
              Title: values?.SpinoffCode + "-" + ("0" + values?.Season).slice(-2) + ("0" + values?.Episode).slice(-2) + " " + values?.EpisodeName,
            }
          }
        },
        fields: [
          {
            type: "datetime",
            name: "Date",
            required: true,
          },
          {
            type: "string",
            name: "SpinoffCode",
            required: true,
            options: [
              {
                "value": "TOS",
                "label": "The Original Series"
              },
              {
                "value": "TAS",
                "label": "The Animated Series"
              },
              {
                "value": "TNG",
                "label": "The Next Generation"
              },
              {
                "value": "DS9",
                "label": "Deep Space Nine"
              },
              {
                "value": "VOY",
                "label": "Voyager"
              },
              {
                "value": "ENT",
                "label": "Enterprise"
              },
              {
                "value": "DIS",
                "label": "Discovery"
              },
              {
                "value": "SHO",
                "label": "Short Treks"
              },
              {
                "value": "LOW",
                "label": "Lower Decks"
              },
              {
                "value": "PIC",
                "label": "Picard"
              },
              {
                "value": "PRO",
                "label": "Prodigy"
              },
              {
                "value": "SNW",
                "label": "Strange New Worlds"
              },
              {
                "value": "MOV",
                "label": "All 13 films"
              },
            ]
          },
          {
            type: "string",
            name: "EpisodeName",
            required: true,
          },
          {
            type: "number",
            name: "Season",
            required: true,
          },
          {
            type: "number",
            name: "Episode",
            required: true,
          },
          {
            type: "number",
            name: "StarTrekValues",
            required: true,
          },
          {
            type: "number",
            name: "Inspiring",
            required: true,
          },
          {
            type: "number",
            name: "StoryDevelopment",
            required: true,
          },
          {
            type: "number",
            name: "OverallScore",
            required: true,
            label: "[AUTO] Overall Score"
          },
          {
            type: "string",
            name: "imdb",
            required: true,
          },
          {
            type: "string",
            name: "Title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            label: 'tags',
            name: 'tags',
            type: 'string',
            list: true,
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
          },
          {
            label: "Cover Photo [AUTO]",
            name: "cover",
            type: "object",
            fields: [
              {
                name: "image",
                type: "string"
              },
              {
                label: "ALT Text",
                name: "alt",
                type: "string"
              }
            ]
          }
        ],
      },
    ],
  },
});
