// List of all Google Fonts to be loaded
export const fonts = [
    "Abhaya Libre",
    "Aleo",
    "Archivo",
    "Assistant",
    "B612",
    "Bebas Neue",
    "Black Ops One",
    "Brawler",
    "Cabin",
    "Caladea",
    "Cardo",
    "Chivo",
    "Comic Sans MS",
    "Crimson Text",
    "DM Serif Text",
    "Enriqueta",
    "Fira Sans",
    "Frank Ruhl Libre",
    "Gabarito",
    "Gelasio",
    "Grenze Gotisch",
    "IBM Plex Sans",
    "Inconsolata",
    "Inter",
    "Josefin Sans",
    "Kanit",
    "Karla",
    "Lato",
    "Libre Baskerville",
    "Libre Franklin",
    "Lora",
    "Merriweather",
    "Montserrat",
    "Neuton",
    "Noto Serif",
    "Nunito",
    "Open Sans",
    "OpenDyslexic2",
    "Oswald",
    "Permanent Marker",
    "Pixelify Sans",
    "Playfair Display",
    "Poetsen One",
    "Poppins",
    "PT Sans",
    "PT Serif",
    "Quicksand",
    "Raleway",
    "Roboto",
    "Roboto Slab",
    "Rubik",
    "Rubik Doodle Shadow",
    "Sedan SC",
    "Shadows Into Light",
    "Single Day",
    "Source Sans 3",
    "Source Serif 4",
    "Spectral",
    "Titillium Web",
    "Ubuntu",
    "Work Sans",
];

export function getGoogleFontsUrl(): string {
    let fontUrl = "https://fonts.googleapis.com/css2";
    let first = true;
    for (const font of fonts) {
        if (
            font != "Comic Sans MS" &&
            font != "OpenDyslexic2" &&
            font != "Open Sans"
        ) {
            fontUrl += `${first ? "?" : "&"}family=${font.replaceAll(" ", "+")}`;
            first = false;
        }
    }
    fontUrl += "&display=swap";
    return fontUrl;
}
