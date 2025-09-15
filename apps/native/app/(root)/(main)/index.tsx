import { Icon } from "@/components/Icon";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Link } from "expo-router";
import { Button, useTheme } from "heroui-native";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// import {api} form
export default function HomeRoute() {
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();
	const userData = useQuery(api.users.getAllUserDataQuery);
	if (!userData) return null;
	return (
    <View
        className="flex-1 gap-6 px-8"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
            {/* Top welcome only */}
            <View className="gap-2">
                <Text className="font-extrabold text-5xl text-foreground">
                    Welcome {userData.userMetaData.name}
                </Text>
            </View>

            {/* Push CTAs to bottom */}
            <View className="flex-1 justify-end gap-6">
                <View className="gap-3">
                    <Text className="text-lg font-semibold">Start editing</Text>
                    <View className="gap-3">
                        <Link href={"/(root)/(main)/trends"} asChild>
                            <Button
                                className="rounded-full justify-start border border-accent bg-transparent"
                                size="lg"
                                variant="tertiary"
                            >
                                <Button.StartContent>
                                    <Icon name="trending-up-outline" size={18} color={colors.accent} />
                                </Button.StartContent>
                                <Button.LabelContent className="text-left">
                                    <View style={{ alignItems: "flex-start" }}>
                                        <Text style={{ color: colors.accent }} className="font-bold">Trends</Text>
                                        <Text style={{ color: colors.accent, opacity: 0.85 }} className="text-sm">popular prompts and styles</Text>
                                    </View>
                                </Button.LabelContent>
                            </Button>
                        </Link>
                        <Link href={"/(root)/(main)/(studio)/create"} asChild>
                            <Button className="rounded-full justify-start" size="lg" variant="secondary">
                                <Button.StartContent>
                                    <Icon name="color-wand-outline" size={18} color={colors.foreground} />
                                </Button.StartContent>
                                <Button.LabelContent className="text-left">
                                    <View style={{ alignItems: "flex-start" }}>
                                        <Text style={{ color: colors.foreground }} className="font-bold">Create</Text>
                                        <Text style={{ color: colors.foreground, opacity: 0.75 }} className="text-sm">a new image never seen before</Text>
                                    </View>
                                </Button.LabelContent>
                            </Button>
                        </Link>
                        <Link href={"/(root)/(main)/(studio)/edit"} asChild>
                            <Button className="rounded-full justify-start" size="lg" variant="secondary">
                                <Button.StartContent>
                                    <Icon name="brush-outline" size={18} color={colors.foreground} />
                                </Button.StartContent>
                                <Button.LabelContent className="text-left">
                                    <View style={{ alignItems: "flex-start" }}>
                                        <Text style={{ color: colors.foreground }} className="font-bold">Edit or Mix</Text>
                                        <Text style={{ color: colors.foreground, opacity: 0.75 }} className="text-sm">an existing image with another</Text>
                                    </View>
                                </Button.LabelContent>
                            </Button>
                        </Link>
                        <Link href={"/(root)/(main)/(studio)/scale"} asChild>
                            <Button className="rounded-full justify-start" size="lg" variant="secondary">
                                <Button.StartContent>
                                    <Icon name="expand-outline" size={18} color={colors.foreground} />
                                </Button.StartContent>
                                <Button.LabelContent className="text-left">
                                    <View style={{ alignItems: "flex-start" }}>
                                        <Text style={{ color: colors.foreground }} className="font-bold">Scale</Text>
                                        <Text style={{ color: colors.foreground, opacity: 0.75 }} className="text-sm">upscale and enhance details</Text>
                                    </View>
                                </Button.LabelContent>
                            </Button>
                        </Link>
                        <Link href={"/(root)/(main)/(studio)/restore"} asChild>
                            <Button className="rounded-full justify-start" size="lg" variant="secondary">
                                <Button.StartContent>
                                    <Icon name="refresh-outline" size={18} color={colors.foreground} />
                                </Button.StartContent>
                                <Button.LabelContent className="text-left">
                                    <View style={{ alignItems: "flex-start" }}>
                                        <Text style={{ color: colors.foreground }} className="font-bold">Restore</Text>
                                        <Text style={{ color: colors.foreground, opacity: 0.75 }} className="text-sm">fix blur, scratches and color</Text>
                                    </View>
                                </Button.LabelContent>
                            </Button>
                        </Link>
                    </View>
                </View>

                <View className="flex-row gap-3">
                    <Link href={"/(root)/(main)/library"} asChild>
                        <Button className="rounded-full flex-1" size={"lg"} variant="secondary">
                            <Button.LabelContent>Library</Button.LabelContent>
                            <Button.EndContent>
                                <Icon name="chevron-forward" size={18} color={colors.foreground} />
                            </Button.EndContent>
                        </Button>
                    </Link>
                    <Link href={"/(root)/(main)/settings"} asChild>
                        <Button className="rounded-full flex-1" size={"lg"}>
                            <Button.LabelContent>Settings</Button.LabelContent>
                    <Button.EndContent>
                        <Icon name="chevron-forward" size={18} color={colors.background} />
                    </Button.EndContent>
                        </Button>
                    </Link>
                </View>
            </View>
        </View>
	);
}
