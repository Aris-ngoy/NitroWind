#!/usr/bin/env bun
// @ts-nocheck

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { COLORS, DEFAULT_STYLE_CONTEXT, SPACING, parseClassName } from "nitro-wind-core";

const [command, ...args] = process.argv.slice(2);

function printHelp(): void {
	console.log(`nitro-wind CLI

Usage:
  nitro-wind info
  nitro-wind validate "<className>"
  nitro-wind generate-theme [outDir]

Commands:
  info             Print engine token coverage
  validate         Resolve a className string against the JS engine
  generate-theme   Write default color/spacing tokens as JSON
`);
}

function info(): void {
	const palettes = Object.keys(COLORS).length;
	const spacing = Object.keys(SPACING).length;
	console.log(`nitro-wind tokens
  color entries: ${palettes}
  spacing steps: ${spacing}
  platforms: ios, android, web
  variants: dark, light, group-active, group-focus, breakpoints
`);
}

function validate(className: string): void {
	if (!className) {
		console.error("Pass a className string to validate.");
		process.exit(1);
	}
	const style = parseClassName(className, DEFAULT_STYLE_CONTEXT);
	console.log(JSON.stringify(style, null, 2));
}

function generateTheme(outDir = "./nitro-wind-theme"): void {
	const dir = resolve(process.cwd(), outDir);
	mkdirSync(dir, { recursive: true });
	writeFileSync(resolve(dir, "colors.json"), `${JSON.stringify(COLORS, null, 2)}\n`);
	writeFileSync(resolve(dir, "spacing.json"), `${JSON.stringify(SPACING, null, 2)}\n`);
	console.log(`Wrote theme tokens to ${dir}`);
}

switch (command) {
	case "info":
		info();
		break;
	case "validate":
		validate(args[0] ?? "");
		break;
	case "generate-theme":
		generateTheme(args[0]);
		break;
	default:
		printHelp();
}
