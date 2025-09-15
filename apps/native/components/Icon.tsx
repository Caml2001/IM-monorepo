import React from "react";
import { Platform, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

let SymbolView: any;
try {
  // @ts-ignore
  SymbolView = require("expo-symbols").SymbolView;
} catch {}

type Props = { name: string; size?: number; color?: string; style?: 'outline' | 'fill' };

// SVG icons as strings
const svgIcons: Record<string, string> = {
  // Basic UI
  close: `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 18 18"><g stroke-width="1.5" fill="none" stroke="currentColor"><line x1="14" y1="4" x2="4" y2="14" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"></line><line x1="4" y1="4" x2="14" y2="14" stroke-linecap="round" stroke-linejoin="round"></line></g></svg>`,
  home: `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 18 18"><g stroke-width="1.5" fill="none" stroke="currentColor"><line x1="9" y1="16" x2="9" y2="12.75" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"></line><path d="M3.145,6.2l5.25-3.99c.358-.272,.853-.272,1.21,0l5.25,3.99c.249,.189,.395,.484,.395,.796v7.254c0,1.105-.895,2-2,2H4.75c-1.105,0-2-.895-2-2V6.996c0-.313,.146-.607,.395-.796Z" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>`,
  search: `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 18 18"><g stroke-width="1.5" fill="none" stroke="currentColor"><line x1="15.25" y1="15.25" x2="11.285" y2="11.285" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"></line><circle cx="7.75" cy="7.75" r="5" stroke-linecap="round" stroke-linejoin="round"></circle></g></svg>`,
  library: `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 18 18"><g stroke-width="1.5" fill="none" stroke="currentColor"><path d="M2.25,8.75V4.75c0-1.105,.895-2,2-2h1.951c.607,0,1.18,.275,1.56,.748l.603,.752h5.386c1.105,0,2,.895,2,2v2.844" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"></path><path d="M4.25,6.75H13.75c1.105,0,2,.895,2,2v4.5c0,1.105-.895,2-2,2H4.25c-1.105,0-2-.895-2-2v-4.5c0-1.105,.895-2,2-2Z" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>`,
  add: `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 18 18"><g stroke-width="1.5" fill="none" stroke="currentColor"><line x1="9" y1="3.25" x2="9" y2="14.75" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"></line><line x1="3.25" y1="9" x2="14.75" y2="9" stroke-linecap="round" stroke-linejoin="round"></line></g></svg>`,
  
  // Chevrons
  "chevron-forward": `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 18 18"><g stroke-width="1.5" fill="none" stroke="currentColor"><polyline points="6.5 2.75 12.75 9 6.5 15.25" stroke-linecap="round" stroke-linejoin="round"></polyline></g></svg>`,
  "chevron-back": `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 18 18"><g stroke-width="1.5" fill="none" stroke="currentColor"><polyline points="11.5 15.25 5.25 9 11.5 2.75" stroke-linecap="round" stroke-linejoin="round"></polyline></g></svg>`,
  "chevron-up": `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 18 18"><g stroke-width="1.5" fill="none" stroke="currentColor"><polyline points="2.75 11.5 9 5.25 15.25 11.5" stroke-linecap="round" stroke-linejoin="round"></polyline></g></svg>`,
  "chevron-down": `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 18 18"><g stroke-width="1.5" fill="none" stroke="currentColor"><polyline points="15.25 6.5 9 12.75 2.75 6.5" stroke-linecap="round" stroke-linejoin="round"></polyline></g></svg>`,
  
  // Creative tools
  "color-wand-outline": `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 18 18"><g stroke-width="1.5" fill="none" stroke="currentColor"><line x1="2.75" y1="15.25" x2="10.749" y2="7.251" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"></line><polygon points="9.998 2.052 12.337 3.579 14.921 2.519 14.191 5.215 15.998 7.344 13.209 7.483 11.742 9.86 10.748 7.25 8.034 6.59 10.209 4.837 9.998 2.052" stroke-linecap="round" stroke-linejoin="round"></polygon></g></svg>`,
  "brush-outline": `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 18 18"><g stroke-width="1.5" fill="none" stroke="currentColor"><path d="M6.956,9.044L13.534,2.466c.621-.621,1.629-.621,2.25,0h0c.621,.621,.621,1.629,0,2.25l-6.578,6.578" stroke-linecap="round" stroke-linejoin="round"></path><path d="M1.75,14.706c2.703,.812,4.896,.88,6.689-.955,1.081-1.085,1.081-2.845,0-3.931s-2.826-1.102-3.916,0c-1.773,1.792-.225,3.494-2.773,4.886Z" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"></path></g></svg>`,
  "expand-outline": `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 18 18"><g stroke-width="1.5" fill="none" stroke="currentColor"><rect x="2.75" y="2.75" width="6" height="6" rx="2" ry="2" transform="translate(11.5) rotate(90)" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"></rect><polyline points="9.75 12.75 12.75 12.75 12.75 9.75" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"></polyline><line x1="12.75" y1="12.75" x2="10" y2="10" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"></line><path d="M2.75,10.75v2.5c0,1.105,.895,2,2,2H13.25c1.105,0,2-.895,2-2V4.75c0-1.105-.895-2-2-2h-2.5" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>`,
  "refresh-outline": `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 18 18"><g stroke-width="1.5" fill="none" stroke="currentColor"><polyline points="8.5 12.75 10.75 15 8.5 17.25" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"></polyline><path d="M4.952,4.238c-1.347,1.146-2.202,2.855-2.202,4.762,0,3.452,2.798,6.25,6.25,6.25,.579,0,1.14-.079,1.672-.226" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"></path><polyline points="9.5 5.25 7.25 3 9.5 .75" stroke-linecap="round" stroke-linejoin="round"></polyline><path d="M13.048,13.762c1.347-1.146,2.202-2.855,2.202-4.762,0-3.452-2.798-6.25-6.25-6.25-.597,0-1.175,.084-1.722,.24" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>`,
  "image-outline": `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 18 18"><g stroke-width="1.5" fill="none" stroke="currentColor"><path d="M3.762,14.989l6.074-6.075c.781-.781,2.047-.781,2.828,0l2.586,2.586" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><rect x="2.75" y="2.75" width="12.5" height="12.5" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round"></rect><circle cx="6.25" cy="7.25" r="1.25" stroke="none" fill="currentColor"></circle></g></svg>`,
  
  // Actions
  "share-outline": `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 18 18"><g stroke-width="1.5" fill="none" stroke="currentColor"><line x1="15.813" y1="2.187" x2="7.657" y2="10.343" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"></line><path d="M15.947,2.73l-4.154,12.923c-.142,.443-.743,.509-.977,.106l-3.159-5.416L2.241,7.184c-.402-.235-.337-.835,.106-.977L15.27,2.053c.417-.134,.811,.26,.677,.677Z" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>`,
  share: `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 18 18"><g stroke-width="1.5" fill="none" stroke="currentColor"><line x1="15.813" y1="2.187" x2="7.657" y2="10.343" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"></line><path d="M15.947,2.73l-4.154,12.923c-.142,.443-.743,.509-.977,.106l-3.159-5.416L2.241,7.184c-.402-.235-.337-.835,.106-.977L15.27,2.053c.417-.134,.811,.26,.677,.677Z" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>`,
  "download-outline": `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 18 18"><g stroke-width="1.5" fill="none" stroke="currentColor"><polyline points="11.5 5.75 9 8.25 6.5 5.75" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"></polyline><line x1="9" y1="8.25" x2="9" y2="2.75" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"></polyline><path d="M16.214,9.75h-4.464v1c0,.552-.448,1-1,1h-3.5c-.552,0-1-.448-1-1v-1H1.787" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12,2.75h.137c.822,0,1.561,.503,1.862,1.269l2.113,5.379c.092,.233,.138,.481,.138,.731v3.121c0,1.105-.895,2-2,2H3.75c-1.105,0-2-.895-2-2v-3.121c0-.25,.047-.498,.138-.731l2.113-5.379c.301-.765,1.039-1.269,1.862-1.269h.137" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>`,
  download: `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 18 18"><g stroke-width="1.5" fill="none" stroke="currentColor"><polyline points="11.5 5.75 9 8.25 6.5 5.75" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"></polyline><line x1="9" y1="8.25" x2="9" y2="2.75" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"></polyline><path d="M16.214,9.75h-4.464v1c0,.552-.448,1-1,1h-3.5c-.552,0-1-.448-1-1v-1H1.787" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12,2.75h.137c.822,0,1.561,.503,1.862,1.269l2.113,5.379c.092,.233,.138,.481,.138,.731v3.121c0,1.105-.895,2-2,2H3.75c-1.105,0-2-.895-2-2v-3.121c0-.25,.047-.498,.138-.731l2.113-5.379c.301-.765,1.039-1.269,1.862-1.269h.137" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>`,
  
  // Stats
  "trending-up-outline": `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 18 18"><g stroke-width="1.5" fill="none" stroke="currentColor"><rect x="13.25" y="2.75" width="2.5" height="12.5" rx="1" ry="1" stroke-linecap="round" stroke-linejoin="round"></rect><rect x="7.75" y="7.75" width="2.5" height="7.5" rx="1" ry="1" stroke-linecap="round" stroke-linejoin="round"></rect><rect x="2.25" y="11.75" width="2.5" height="3.5" rx="1" ry="1" stroke-linecap="round" stroke-linejoin="round"></rect><polyline points="6.25 2.75 8.75 2.75 8.75 5.25" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"></polyline><line x1="8.5" y1="3" x2="2.75" y2="8.75" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"></line></g></svg>`,
  
  // Misc
  "ellipsis-horizontal": `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 18 18"><g fill="currentColor"><circle cx="3" cy="9" r="1.5"></circle><circle cx="9" cy="9" r="1.5"></circle><circle cx="15" cy="9" r="1.5"></circle></g></svg>`,
};

const nameMap: Record<string, string> = {
  "color-wand-outline": "wand.and.stars",
  "brush-outline": "paintbrush",
  "expand-outline": "arrow.up.left.and.arrow.down.right",
  "refresh-outline": "arrow.counterclockwise",
  "chevron-forward": "chevron.forward",
  "chevron-back": "chevron.backward",
  "ellipsis-horizontal": "ellipsis",
  "share-outline": "square.and.arrow.up",
  "download-outline": "arrow.down.circle",
  "image-outline": "photo",
};

const textFallback: Record<string, string> = {
  "color-wand-outline": "✨",
  "brush-outline": "🖌️",
  "expand-outline": "↗️",
  "refresh-outline": "↻",
  "chevron-forward": "›",
  "chevron-back": "‹",
  "chevron-up": "⌃",
  "chevron-down": "⌄",
  "ellipsis-horizontal": "⋯",
  "share-outline": "⇪",
  "download-outline": "⇩",
  "image-outline": "🖼️",
  "trending-up-outline": "📈",
  close: "✕",
  home: "🏠",
  search: "🔍",
  library: "📁",
  add: "+",
  share: "⇪",
  download: "⇩",
};

export function Icon({ name, size = 18, color = "currentColor", style = 'outline' }: Props) {
  // Try to use local SVG icon first
  const svgIcon = svgIcons[name];
  if (svgIcon) {
    // Replace currentColor with the actual color
    const coloredSvg = svgIcon.replace(/currentColor/g, color);
    return (
      <View style={{ width: size, height: size }}>
        <SvgXml xml={coloredSvg} width={size} height={size} />
      </View>
    );
  }
  
  // Fallback to SF Symbols on iOS
  const sf = nameMap[name];
  if (Platform.OS === "ios" && SymbolView && sf) {
    return <SymbolView name={sf} tintColor={color} style={{ width: size, height: size }} />;
  }
  
  // Final fallback to text
  return <Text style={{ fontSize: size, color }}>{textFallback[name] ?? "•"}</Text>;
}

