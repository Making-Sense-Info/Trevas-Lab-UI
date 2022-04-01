import React, { useState, useEffect, useCallback } from 'react';
import { useRecoilState } from 'recoil';
import { UUID_State, SPARK_SCRIPT, SPARK_BINDINGS } from 'store';
import Header from 'components/common/header';
import Configuration from '../configuration';
import SparkComponent from './main';
import { useAuthenticatedFetch } from 'utils/hooks';
import { CLUSTER_KUBERNETES, JDBC, S3, SPARK } from 'utils/constants';

const mode = SPARK;
const context = CLUSTER_KUBERNETES;

const Spark = () => {
	const [script, setScript] = useRecoilState(SPARK_SCRIPT);
	const [errors, setErrors] = useState([]);
	const [loadingPost, setLoadingPost] = useState(false);
	const [bindings, setBindings] = useRecoilState(SPARK_BINDINGS);
	const [res, setRes] = useState(null);
	const [apiError, setApiError] = useState('');
	const [UUID, setUUID] = useRecoilState(UUID_State);
	const [currentJobId, setCurrentJobId] = useState('');

	const onChangeScript = (e) => {
		setScript(e);
		setRes(null);
		setApiError('');
	};

	const onChangeBindings = (e) => {
		setBindings(e);
		setRes(null);
		setApiError('');
	};

	const authFetch = useAuthenticatedFetch();

	const getRes = useCallback(() => {
		setRes(null);
		setLoadingPost(true);
		const formatedBindings = Object.entries(bindings).reduce(
			(acc, [k, v]) => {
				const { type, ...rest } = v;
				if (type === S3) {
					const { bindings } = acc;
					return { ...acc, s3ForBindings: { ...bindings, [k]: rest } };
				}
				if (type === JDBC) {
					const { queriesForBindings } = acc;
					return {
						...acc,
						queriesForBindings: { ...queriesForBindings, [k]: rest },
					};
				}
				return acc;
			},
			{ bindings: {}, s3ForBindings: {} }
		);

		authFetch(
			`execute?mode=${mode}&type=${context}`,
			{ vtlScript: script, toSave: {}, ...formatedBindings },
			'POST'
		)
			.then((res) => {
				if (res.ok) return res.text();
				return res.json();
			})
			.then((res) => {
				if (res.error) setApiError(res.error);
				else {
					//TODO: fix to delete replace
					const r = res.replace(/"/g, '');
					setUUID(r);
					setCurrentJobId(r);
				}
			})
			.catch((e) => {
				setApiError(e);
			});
	}, [authFetch, bindings, script, setUUID]);

	useEffect(() => {
		if (UUID === null && currentJobId) {
			authFetch(`job/${currentJobId}/bindings`)
				.then((r) => r.json())
				.then((r) => {
					setRes(r);
				})
				.then(() => {
					setLoadingPost(false);
				})
				.then(() => {
					setCurrentJobId('');
				});
		}
	}, [UUID, authFetch, currentJobId]);

	return (
		<div className="container">
			<Header
				label={'Spark execution'}
				disableExecution={
					errors.length > 0 || !script || Object.values(bindings).length === 0
				}
				getRes={getRes}
				noReturn
			/>
			<Configuration
				script={script}
				setScript={setScript}
				bindings={bindings}
				setBindings={setBindings}
				hasScriptErrors={errors.length > 0}
			/>
			<SparkComponent
				script={script}
				setScript={onChangeScript}
				setErrors={setErrors}
				// variableURLs={urls}
				bindings={bindings}
				setBindings={onChangeBindings}
				res={res}
				loadingPost={loadingPost}
				apiError={apiError}
			/>
		</div>
	);
};

export default Spark;