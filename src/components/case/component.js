import React, { useState, useEffect, useCallback } from 'react';
import { Loading } from '@inseefr/wilco';
import { Position } from 'monaco-editor';
import Header from './header';
import Editor from '../temp/editor/VtlEditor';
import Input from './input';
import ToSave from './to-save';
import Output from './output';
import { useAuthenticatedFetch } from 'utils/hooks';
import { IN_MEMORY, SPARK_LOCAL } from 'utils/constants';

const Case = ({ config, context }) => {
	const {
		label,
		inMemoryData,
		sparkLocalData,
		sparkClusterData,
		script,
		defaultBindings,
	} = config;

	const [vtl, setVtl] = useState(null);
	const [errors, setErrors] = useState([]);
	const [loading, setLoading] = useState(true);
	const [loadingPost, setLoadingPost] = useState(false);
	const [bindings, setBindings] = useState(defaultBindings);
	const [toSave, setToSave] = useState({});
	const [res, setRes] = useState(null);
	const [apiError, setApiError] = useState('');
	const setCursorPosition = useState(new Position(0, 0))[1];
	const [tempCursor] = useState(new Position(0, 0));

	const onChange = (e) => {
		setVtl(e);
		setRes(null);
		setApiError('');
	};

	const authFetch = useAuthenticatedFetch();

	const getRes = useCallback(() => {
		setRes(null);
		setLoadingPost(true);
		const updatedBindings = Object.entries(bindings).reduce(
			(acc, [k, v]) => (k && v ? { ...acc, [k]: v } : acc),
			{}
		);
		const updatedToSave = Object.entries(toSave).reduce(
			(acc, [k, v]) => (k && v ? { ...acc, [k]: v } : acc),
			{}
		);
		authFetch(
			context,
			{ vtlScript: vtl, bindings: updatedBindings, toSave: updatedToSave },
			'POST'
		)
			.then((res) => res.json())
			.then((r) => {
				if (r.error) setApiError(r.error.chars);
				else setRes(r);
			})
			.then(() => {
				setLoadingPost(false);
			});
	}, [authFetch, bindings, context, vtl]);

	useEffect(() => {
		if (context === IN_MEMORY) {
			Promise.all(
				inMemoryData.map(({ url }) => fetch(url).then((d) => d.json()))
			)
				.then((arr) => {
					const loadedBindings = arr.reduce(
						(acc, d, i) => ({ ...acc, [inMemoryData[i].name]: d }),
						defaultBindings
					);
					setBindings(loadedBindings);
				})
				.then(() => {
					setLoading(false);
				});
		} else if (context === SPARK_LOCAL) {
			setBindings({ ...sparkLocalData, ...defaultBindings });
			setLoading(false);
		} else {
			setBindings({ ...sparkClusterData, ...defaultBindings });
			setLoading(false);
		}
	}, [
		inMemoryData,
		sparkLocalData,
		sparkClusterData,
		defaultBindings,
		context,
	]);

	useEffect(() => {
		script
			? fetch(script)
					.then((s) => s.text())
					.then((s) => {
						setVtl(s);
					})
					.catch(() => {
						setVtl('');
					})
			: setVtl('');
	}, [script]);

	if (loading) return <Loading text="Loading..." />;
	if (loadingPost) return <Loading text="Ongoing treatments..." />;

	return (
		<div className="container">
			<Header label={label} errors={errors} getRes={getRes} />
			<div className="row">
				<div className="col-md-12">
					<h2>VTL script</h2>
					{vtl !== null && (
						<Editor
							resizeLayout={[false, true, 100]}
							code={vtl}
							setCode={onChange}
							setCodeChanged={() => false}
							theme="vs-dark"
							languageVersion="vtl-2.0-insee"
							setCursorPosition={setCursorPosition}
							tempCursor={tempCursor}
							setErrors={setErrors}
							// TODO: enable several dataset suggestions
							suggesterURL={inMemoryData[0]?.url || ''}
						/>
					)}
				</div>
			</div>
			<div className="row">
				<div className="col-md-6">
					<Input
						bindings={bindings}
						setBindings={setBindings}
						setRes={setRes}
						context={context}
					/>
					<ToSave toSave={toSave} setToSave={setToSave} context={context} />
				</div>
				<div className="col-md-6">
					<Output res={res} context={context} apiError={apiError} />
				</div>
			</div>
		</div>
	);
};

export default Case;
