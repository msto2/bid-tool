/// <reference types="vite/client" />

declare namespace NodeJS {
	interface ProcessEnv {
		SWID: string;
		ESPN_S2: string;
	}
}

declare module '$env/static/private' {
	export const SWID: string;
	export const ESPN_S2: string;
}
