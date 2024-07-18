import { onMount, untrack } from "svelte";
import { browser } from "$lib/internal/utils/browser.js";
import { addEventListener } from "$lib/internal/utils/event.js";
import { IsSupported } from "$lib/utilities/index.js";

/**
 * @desc The `NetworkInformation` interface of the Network Information API
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
 */
type NetworkInformation = {
	readonly downlink: number;
	readonly downlinkMax: number;
	readonly effectiveType: "slow-2g" | "2g" | "3g" | "4g";
	readonly rtt: number;
	readonly saveData: boolean;
	readonly type:
		| "bluetooth"
		| "cellular"
		| "ethernet"
		| "none"
		| "wifi"
		| "wimax"
		| "other"
		| "unknown";
} & EventTarget;

type NavigatorWithConnection = Navigator & { connection: NetworkInformation };

/**
 * Tracks the state of browser's network connection.
 */
export class NetworkStatus {
	#isSupported = new IsSupported(() => browser && "navigator" in window);
	#navigator?: Navigator = $derived(this.#isSupported.current ? window.navigator : undefined);
	#connection?: NetworkInformation = $derived(
		this.#navigator && "connection" in this.#navigator
			? (this.#navigator as NavigatorWithConnection).connection
			: undefined
	);

	#online: boolean = $state(false);
	#updatedAt: Date = $state(new Date());
	#downlink?: NetworkInformation["downlink"] = $state();
	#downlinkMax?: NetworkInformation["downlinkMax"] = $state();
	#effectiveType?: NetworkInformation["effectiveType"] = $state();
	#rtt?: NetworkInformation["rtt"] = $state();
	#saveData?: NetworkInformation["saveData"] = $state();
	#type?: NetworkInformation["type"] = $state();

	constructor() {
		onMount(() => {
			this.#updateStatus();
			const callbacks: VoidFunction[] = [];

			if (this.#connection) {
				callbacks.push(
					addEventListener(this.#connection, "change", this.#updateStatus, { passive: true })
				);
			} else {
				callbacks.push(addEventListener(window, "online", this.#updateStatus, { passive: true }));
				callbacks.push(addEventListener(window, "offline", this.#updateStatus, { passive: true }));
			}

			return () => {
				callbacks.forEach((c) => c());
			};
		});
	}

	#updateStatus = () => {
		if (!this.#navigator) return;
		this.#online = this.#navigator.onLine;
		this.#updatedAt = new Date();
		if (!this.#connection) return;

		this.#downlink = this.#connection.downlink;
		this.#downlinkMax = this.#connection.downlinkMax;
		this.#effectiveType = this.#connection.effectiveType;
		this.#rtt = this.#connection.rtt;
		this.#saveData = this.#connection.saveData;
		this.#type = this.#connection.type;
	};

	/**
	 * @desc Whether the network status API is supported on this device.
	 */
	get isSupported() {
		return this.#isSupported.current;
	}

	/**
	 * @desc Returns the online status of the browser.
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine
	 */
	get online() {
		return this.#online;
	}

	/**
	 * @desc The {Date} object pointing to the moment when state update occurred.
	 */
	get updatedAt() {
		return this.#updatedAt;
	}

	/**
	 * @desc Effective bandwidth estimate in megabits per second, rounded to the
	 * nearest multiple of 25 kilobits per seconds.
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/downlink
	 */
	get downlink() {
		return this.#downlink;
	}

	/**
	 * @desc Maximum downlink speed, in megabits per second (Mbps), for the
	 * underlying connection technology
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/downlinkMax
	 */
	get downlinkMax() {
		return this.#downlinkMax;
	}

	/**
	 * @desc Effective type of the connection meaning one of 'slow-2g', '2g', '3g', or '4g'.
	 * This value is determined using a combination of recently observed round-trip time
	 * and downlink values.
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType
	 */
	get effectiveType() {
		return this.#effectiveType;
	}

	/**
	 * @desc Estimated effective round-trip time of the current connection, rounded
	 * to the nearest multiple of 25 milliseconds
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/rtt
	 */
	get rtt() {
		return this.#rtt;
	}

	/**
	 * @desc {true} if the user has set a reduced data usage option on the user agent.
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/saveData
	 */
	get saveData() {
		return this.#saveData;
	}

	/**
	 * @desc The type of connection a device is using to communicate with the network.
	 *  @see https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/type
	 */
	get type() {
		return this.#type;
	}
}