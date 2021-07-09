/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { main } from './sign';

main([
	process.env['EsrpCliDllPath']!,
	'windows',
	process.env['ESRPPKI']!,
	process.env['ESRPAADUsername']!,
	process.env['ESRPAADPassword']!,
	'.',
	...process.argv.slice(2)
]);
