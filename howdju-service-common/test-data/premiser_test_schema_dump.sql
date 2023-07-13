--
-- PostgreSQL database dump
--

-- Dumped from database version 12.5 (Debian 12.5-1.pgdg100+1)
-- Dumped by pg_dump version 14.5 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: media_excerpt_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.media_excerpt_type AS ENUM (
    'WRIT_QUOTE'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_settings (
    account_settings_id integer NOT NULL,
    user_id integer,
    paid_contributions_disclosure character varying(4096),
    created timestamp without time zone,
    modified timestamp without time zone
);


--
-- Name: account_settings_account_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.account_settings_account_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: account_settings_account_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.account_settings_account_settings_id_seq OWNED BY public.account_settings.account_settings_id;


--
-- Name: actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.actions (
    user_id integer,
    action_type character varying(128),
    target_id integer,
    target_type character varying(64),
    subject_id integer,
    subject_type character varying(64),
    tstamp timestamp without time zone
);


--
-- Name: writ_quotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.writ_quotes (
    writ_quote_id integer NOT NULL,
    quote_text character varying(65536),
    writ_id integer,
    creator_user_id integer,
    created timestamp without time zone,
    deleted timestamp without time zone,
    normal_quote_text character varying(65536)
);


--
-- Name: citation_references_citation_reference_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.citation_references_citation_reference_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: citation_references_citation_reference_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.citation_references_citation_reference_id_seq OWNED BY public.writ_quotes.writ_quote_id;


--
-- Name: writs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.writs (
    writ_id integer NOT NULL,
    title character varying(2048),
    normal_title character varying(2048),
    creator_user_id integer,
    created timestamp without time zone,
    deleted timestamp without time zone
);


--
-- Name: citations_citation_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.citations_citation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: citations_citation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.citations_citation_id_seq OWNED BY public.writs.writ_id;


--
-- Name: content_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_reports (
    content_report_id bigint NOT NULL,
    entity_type character varying(64),
    entity_id integer,
    url character varying(65536),
    types character varying(64)[],
    description character varying(4096),
    reporter_user_id integer,
    created timestamp without time zone
);


--
-- Name: content_reports_content_report_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.content_reports_content_report_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: content_reports_content_report_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.content_reports_content_report_id_seq OWNED BY public.content_reports.content_report_id;


--
-- Name: dom_anchors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dom_anchors (
    url_locator_id bigint NOT NULL,
    exact_text character varying(65536),
    prefix_text character varying(65535),
    suffix_text character varying(65536),
    start_offset integer,
    end_offset integer,
    creator_user_id bigint NOT NULL,
    created timestamp without time zone NOT NULL,
    deleted timestamp without time zone,
    CONSTRAINT dom_anchors_check CHECK ((end_offset >= start_offset)),
    CONSTRAINT dom_anchors_exact_text_check CHECK (((exact_text)::text <> ''::text)),
    CONSTRAINT dom_anchors_prefix_text_check CHECK (((prefix_text)::text <> ''::text)),
    CONSTRAINT dom_anchors_start_offset_check CHECK ((start_offset >= 0)),
    CONSTRAINT dom_anchors_suffix_text_check CHECK (((suffix_text)::text <> ''::text))
);


--
-- Name: group_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_permissions (
    group_id integer,
    permission_id integer,
    creator_user_id integer,
    created timestamp without time zone,
    deleted timestamp without time zone
);


--
-- Name: groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groups (
    group_id integer NOT NULL,
    name character varying(256),
    creator_user_id integer,
    created timestamp without time zone,
    deleted timestamp without time zone
);


--
-- Name: groups_group_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.groups_group_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: groups_group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.groups_group_id_seq OWNED BY public.groups.group_id;


--
-- Name: job_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_history (
    job_history_id integer NOT NULL,
    job_type character varying(256),
    job_scope character varying(256),
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    status character varying(64),
    message character varying(65536)
);


--
-- Name: job_history_job_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.job_history_job_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: job_history_job_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.job_history_job_history_id_seq OWNED BY public.job_history.job_history_id;


--
-- Name: justification_basis_compound_atoms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.justification_basis_compound_atoms (
    justification_basis_compound_atom_id integer NOT NULL,
    justification_basis_compound_id integer,
    entity_type character varying(64),
    entity_id integer,
    order_position integer
);


--
-- Name: justification_basis_compound__justification_basis_compound__seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.justification_basis_compound__justification_basis_compound__seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: justification_basis_compound__justification_basis_compound__seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.justification_basis_compound__justification_basis_compound__seq OWNED BY public.justification_basis_compound_atoms.justification_basis_compound_atom_id;


--
-- Name: justification_basis_compounds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.justification_basis_compounds (
    justification_basis_compound_id integer NOT NULL,
    creator_user_id integer,
    created timestamp without time zone,
    deleted timestamp without time zone
);


--
-- Name: justification_basis_compounds_justification_basis_compound__seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.justification_basis_compounds_justification_basis_compound__seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: justification_basis_compounds_justification_basis_compound__seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.justification_basis_compounds_justification_basis_compound__seq OWNED BY public.justification_basis_compounds.justification_basis_compound_id;


--
-- Name: justification_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.justification_scores (
    justification_id integer,
    creator_job_history_id integer,
    deletor_job_history_id integer,
    score_type character varying(64),
    score double precision,
    created timestamp without time zone,
    deleted timestamp without time zone
);


--
-- Name: justification_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.justification_votes (
    justification_vote_id integer NOT NULL,
    user_id integer,
    justification_id integer,
    polarity character varying(32),
    created timestamp without time zone,
    deleted timestamp without time zone
);


--
-- Name: justifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.justifications (
    justification_id integer NOT NULL,
    root_target_id integer,
    root_polarity character varying(32),
    target_type character varying(64),
    target_id integer,
    basis_type character varying(64),
    basis_id integer,
    polarity character varying(32),
    creator_user_id integer,
    created timestamp without time zone,
    deleted timestamp without time zone,
    root_target_type character varying(64) NOT NULL
);


--
-- Name: justifications_justification_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.justifications_justification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: justifications_justification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.justifications_justification_id_seq OWNED BY public.justifications.justification_id;


--
-- Name: media_excerpt_citations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_excerpt_citations (
    media_excerpt_id bigint NOT NULL,
    source_id bigint NOT NULL,
    pincite character varying(128),
    normal_pincite character varying(128),
    creator_user_id bigint NOT NULL,
    created timestamp without time zone NOT NULL,
    deleted timestamp without time zone,
    CONSTRAINT media_excerpt_citations_normal_pincite_check CHECK (((normal_pincite)::text <> ''::text)),
    CONSTRAINT media_excerpt_citations_pincite_check CHECK (((pincite)::text <> ''::text))
);


--
-- Name: media_excerpt_speakers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_excerpt_speakers (
    media_excerpt_id bigint NOT NULL,
    speaker_persorg_id bigint NOT NULL,
    creator_user_id bigint,
    created timestamp without time zone NOT NULL,
    deleted timestamp without time zone
);


--
-- Name: media_excerpts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_excerpts (
    media_excerpt_id bigint NOT NULL,
    quotation character varying(4096),
    normal_quotation character varying(4096),
    creator_user_id bigint NOT NULL,
    created timestamp without time zone NOT NULL,
    deleted timestamp without time zone,
    CONSTRAINT media_excerpts_normal_quotation_check CHECK (((normal_quotation)::text <> ''::text)),
    CONSTRAINT media_excerpts_quotation_check CHECK (((quotation)::text <> ''::text))
);


--
-- Name: media_excerpts_media_excerpt_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.media_excerpts_media_excerpt_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: media_excerpts_media_excerpt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.media_excerpts_media_excerpt_id_seq OWNED BY public.media_excerpts.media_excerpt_id;


--
-- Name: migration_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migration_translations (
    old_table_name character varying(64),
    new_table_name character varying(64),
    old_id character varying(64),
    new_id character varying(64)
);


--
-- Name: password_reset_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_requests (
    password_reset_request_id integer NOT NULL,
    user_id integer,
    email character varying(128) NOT NULL,
    password_reset_code character varying(1024) NOT NULL,
    expires timestamp without time zone NOT NULL,
    is_consumed boolean NOT NULL,
    created timestamp without time zone NOT NULL,
    deleted timestamp without time zone
);


--
-- Name: password_reset_requests_password_reset_request_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_requests_password_reset_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_requests_password_reset_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_requests_password_reset_request_id_seq OWNED BY public.password_reset_requests.password_reset_request_id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    permission_id integer NOT NULL,
    name character varying(256),
    comment character varying(2048),
    creator_user_id integer,
    created timestamp without time zone,
    deleted timestamp without time zone
);


--
-- Name: permissions_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_permission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permissions_permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_permission_id_seq OWNED BY public.permissions.permission_id;


--
-- Name: persorgs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.persorgs (
    persorg_id integer NOT NULL,
    is_organization boolean NOT NULL,
    name character varying(2048) NOT NULL,
    normal_name character varying(2048) NOT NULL,
    known_for character varying(4096),
    normal_known_for character varying(4096),
    website_url character varying(4096),
    twitter_url character varying(4096),
    wikipedia_url character varying(4096),
    creator_user_id integer NOT NULL,
    created timestamp without time zone NOT NULL,
    modified timestamp without time zone,
    deleted timestamp without time zone
);


--
-- Name: persorgs_persorg_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.persorgs_persorg_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: persorgs_persorg_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.persorgs_persorg_id_seq OWNED BY public.persorgs.persorg_id;


--
-- Name: perspective_justifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.perspective_justifications (
    perspective_id integer,
    justification_id integer
);


--
-- Name: perspectives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.perspectives (
    perspective_id integer NOT NULL,
    proposition_id integer,
    is_featured boolean,
    creator_user_id integer,
    created timestamp without time zone,
    deleted timestamp without time zone
);


--
-- Name: perspectives_perspective_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.perspectives_perspective_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: perspectives_perspective_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.perspectives_perspective_id_seq OWNED BY public.perspectives.perspective_id;


--
-- Name: proposition_compound_atoms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposition_compound_atoms (
    proposition_compound_id integer,
    proposition_id integer,
    order_position integer
);


--
-- Name: proposition_compounds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposition_compounds (
    proposition_compound_id integer NOT NULL,
    creator_user_id integer,
    created timestamp without time zone,
    deleted timestamp without time zone
);


--
-- Name: proposition_compounds_proposition_compound_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.proposition_compounds_proposition_compound_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: proposition_compounds_proposition_compound_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.proposition_compounds_proposition_compound_id_seq OWNED BY public.proposition_compounds.proposition_compound_id;


--
-- Name: proposition_tag_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposition_tag_scores (
    creator_job_history_id integer,
    deletor_job_history_id integer,
    score_type character varying(64),
    score double precision,
    created timestamp without time zone,
    deleted timestamp without time zone,
    proposition_id integer,
    tag_id integer,
    proposition_tag_score_id integer NOT NULL
);


--
-- Name: proposition_tag_scores_proposition_tag_score_id_2_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.proposition_tag_scores_proposition_tag_score_id_2_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: proposition_tag_scores_proposition_tag_score_id_2_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.proposition_tag_scores_proposition_tag_score_id_2_seq OWNED BY public.proposition_tag_scores.proposition_tag_score_id;


--
-- Name: proposition_tag_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposition_tag_votes (
    proposition_tag_vote_id integer NOT NULL,
    user_id integer,
    proposition_id integer,
    tag_id integer,
    polarity character varying(32),
    created timestamp without time zone,
    deleted timestamp without time zone
);


--
-- Name: proposition_tag_votes_proposition_tag_vote_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.proposition_tag_votes_proposition_tag_vote_id
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: proposition_tag_votes_proposition_tag_vote_id; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.proposition_tag_votes_proposition_tag_vote_id OWNED BY public.proposition_tag_votes.proposition_tag_vote_id;


--
-- Name: propositions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.propositions (
    proposition_id integer NOT NULL,
    text character varying(2048),
    normal_text character varying(2048),
    creator_user_id integer,
    created timestamp without time zone,
    deleted timestamp without time zone
);


--
-- Name: propositions_proposition_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.propositions_proposition_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: propositions_proposition_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.propositions_proposition_id_seq OWNED BY public.propositions.proposition_id;


--
-- Name: registration_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registration_requests (
    registration_request_id integer NOT NULL,
    email character varying(128) NOT NULL,
    registration_code character varying(1024) NOT NULL,
    is_consumed boolean DEFAULT false NOT NULL,
    expires timestamp without time zone NOT NULL,
    created timestamp without time zone NOT NULL,
    deleted timestamp without time zone
);


--
-- Name: registration_requests_registration_request_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.registration_requests_registration_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: registration_requests_registration_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.registration_requests_registration_request_id_seq OWNED BY public.registration_requests.registration_request_id;


--
-- Name: source_excerpt_paraphrases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.source_excerpt_paraphrases (
    source_excerpt_paraphrase_id integer NOT NULL,
    paraphrasing_proposition_id integer,
    source_excerpt_type character varying(64),
    source_excerpt_id integer,
    creator_user_id integer,
    created timestamp without time zone,
    deleted timestamp without time zone
);


--
-- Name: source_excerpt_paraphrases_source_excerpt_paraphrase_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.source_excerpt_paraphrases_source_excerpt_paraphrase_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: source_excerpt_paraphrases_source_excerpt_paraphrase_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.source_excerpt_paraphrases_source_excerpt_paraphrase_id_seq OWNED BY public.source_excerpt_paraphrases.source_excerpt_paraphrase_id;


--
-- Name: sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sources (
    source_id bigint NOT NULL,
    description character varying(2048) NOT NULL,
    normal_description character varying(2048) NOT NULL,
    identifier_doi character varying(128),
    identifier_isbn character varying(128),
    identifier_pmid character varying(128),
    identifier_issn character varying(128),
    identifier_pmc character varying(128),
    identifier_oclc character varying(128),
    identifier_bibcode character varying(128),
    creator_user_id bigint,
    created timestamp without time zone NOT NULL,
    deleted timestamp without time zone,
    CONSTRAINT sources_description_apa_check CHECK (((description)::text <> ''::text)),
    CONSTRAINT sources_identifier_bibcode_check CHECK (((identifier_bibcode)::text <> ''::text)),
    CONSTRAINT sources_identifier_doi_check CHECK (((identifier_doi)::text <> ''::text)),
    CONSTRAINT sources_identifier_isbn_check CHECK (((identifier_isbn)::text <> ''::text)),
    CONSTRAINT sources_identifier_issn_check CHECK (((identifier_issn)::text <> ''::text)),
    CONSTRAINT sources_identifier_oclc_check CHECK (((identifier_oclc)::text <> ''::text)),
    CONSTRAINT sources_identifier_pmc_check CHECK (((identifier_pmc)::text <> ''::text)),
    CONSTRAINT sources_identifier_pmid_check CHECK (((identifier_pmid)::text <> ''::text)),
    CONSTRAINT sources_normal_description_apa_check CHECK (((normal_description)::text <> ''::text))
);


--
-- Name: sources_source_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sources_source_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sources_source_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sources_source_id_seq OWNED BY public.sources.source_id;


--
-- Name: statements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.statements (
    statement_id integer NOT NULL,
    speaker_persorg_id integer NOT NULL,
    sentence_type character varying(64) NOT NULL,
    sentence_id integer NOT NULL,
    root_proposition_id integer NOT NULL,
    creator_user_id integer NOT NULL,
    created timestamp without time zone NOT NULL,
    deleted timestamp without time zone
);


--
-- Name: statements_statement_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.statements_statement_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: statements_statement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.statements_statement_id_seq OWNED BY public.statements.statement_id;


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    tag_id integer NOT NULL,
    type character varying(64),
    name character varying(1024),
    creator_user_id integer,
    created timestamp without time zone,
    deleted timestamp without time zone,
    normal_name character varying(1024)
);


--
-- Name: tags_tag_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tags_tag_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tags_tag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tags_tag_id_seq OWNED BY public.tags.tag_id;


--
-- Name: test; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test (
    the_value character varying(128),
    deleted timestamp without time zone
);


--
-- Name: url_locators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.url_locators (
    url_locator_id bigint NOT NULL,
    media_excerpt_id bigint NOT NULL,
    url_id bigint NOT NULL,
    creator_user_id bigint NOT NULL,
    created timestamp without time zone NOT NULL,
    deleted timestamp without time zone
);


--
-- Name: url_locators_url_locator_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.url_locators_url_locator_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: url_locators_url_locator_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.url_locators_url_locator_id_seq OWNED BY public.url_locators.url_locator_id;


--
-- Name: urls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.urls (
    url_id bigint NOT NULL,
    url character varying(65536) NOT NULL,
    creator_user_id integer,
    created timestamp without time zone,
    deleted timestamp without time zone,
    canonical_url character varying(65536) NOT NULL,
    CONSTRAINT urls_canonical_url_check CHECK (((canonical_url)::text <> ''::text)),
    CONSTRAINT urls_url_check CHECK (((url)::text <> ''::text))
);


--
-- Name: urls_url_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.urls_url_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: urls_url_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.urls_url_id_seq OWNED BY public.urls.url_id;


--
-- Name: user_auth; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_auth (
    user_id integer,
    hash character varying(4096),
    hash_type character varying(32)
);


--
-- Name: user_auth_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_auth_tokens (
    user_id integer,
    auth_token character varying(1024),
    created timestamp without time zone,
    expires timestamp without time zone,
    deleted timestamp without time zone
);


--
-- Name: user_external_ids; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_external_ids (
    user_id integer,
    google_analytics_id character varying(128),
    mixpanel_id character varying(128),
    heap_analytics_id character varying(128),
    sentry_id character varying(128)
);


--
-- Name: user_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_groups (
    user_id integer,
    group_id integer,
    creator_user_id integer,
    created timestamp without time zone,
    deleted timestamp without time zone
);


--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_permissions (
    user_id integer,
    permission_id integer,
    creator_user_id integer,
    created timestamp without time zone,
    deleted timestamp without time zone
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    email character varying(2048),
    short_name character varying(128),
    long_name character varying(1024),
    phone_number character varying(64),
    creator_user_id integer,
    is_active boolean,
    last_login timestamp without time zone,
    created timestamp without time zone,
    deleted timestamp without time zone,
    username character varying(64),
    accepted_terms timestamp without time zone,
    affirmed_majority_consent timestamp without time zone,
    affirmed_13_years_or_older timestamp without time zone,
    affirmed_not_gdpr timestamp without time zone
);


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: votes_vote_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.votes_vote_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: votes_vote_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.votes_vote_id_seq OWNED BY public.justification_votes.justification_vote_id;


--
-- Name: writ_quote_url_target_anchors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.writ_quote_url_target_anchors (
    writ_quote_url_target_anchor_id integer NOT NULL,
    writ_quote_url_target_id integer,
    exact_text character varying(65536) NOT NULL,
    prefix_text character varying(65535),
    suffix_text character varying(65536),
    deleted timestamp without time zone,
    start_offset integer,
    end_offset integer
);


--
-- Name: writ_quote_url_target_anchors_writ_quote_url_target_anchor__seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.writ_quote_url_target_anchors_writ_quote_url_target_anchor__seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: writ_quote_url_target_anchors_writ_quote_url_target_anchor__seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.writ_quote_url_target_anchors_writ_quote_url_target_anchor__seq OWNED BY public.writ_quote_url_target_anchors.writ_quote_url_target_anchor_id;


--
-- Name: writ_quote_url_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.writ_quote_url_targets (
    writ_quote_url_target_id integer NOT NULL,
    writ_quote_id integer,
    url_id integer,
    deleted timestamp without time zone
);


--
-- Name: writ_quote_url_targets_writ_quote_url_target_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.writ_quote_url_targets_writ_quote_url_target_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: writ_quote_url_targets_writ_quote_url_target_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.writ_quote_url_targets_writ_quote_url_target_id_seq OWNED BY public.writ_quote_url_targets.writ_quote_url_target_id;


--
-- Name: writ_quote_urls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.writ_quote_urls (
    writ_quote_id integer,
    url_id integer,
    creator_user_id integer,
    created timestamp without time zone,
    deleted timestamp without time zone
);


--
-- Name: account_settings account_settings_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_settings ALTER COLUMN account_settings_id SET DEFAULT nextval('public.account_settings_account_settings_id_seq'::regclass);


--
-- Name: content_reports content_report_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_reports ALTER COLUMN content_report_id SET DEFAULT nextval('public.content_reports_content_report_id_seq'::regclass);


--
-- Name: groups group_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups ALTER COLUMN group_id SET DEFAULT nextval('public.groups_group_id_seq'::regclass);


--
-- Name: job_history job_history_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_history ALTER COLUMN job_history_id SET DEFAULT nextval('public.job_history_job_history_id_seq'::regclass);


--
-- Name: justification_basis_compound_atoms justification_basis_compound_atom_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.justification_basis_compound_atoms ALTER COLUMN justification_basis_compound_atom_id SET DEFAULT nextval('public.justification_basis_compound__justification_basis_compound__seq'::regclass);


--
-- Name: justification_basis_compounds justification_basis_compound_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.justification_basis_compounds ALTER COLUMN justification_basis_compound_id SET DEFAULT nextval('public.justification_basis_compounds_justification_basis_compound__seq'::regclass);


--
-- Name: justification_votes justification_vote_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.justification_votes ALTER COLUMN justification_vote_id SET DEFAULT nextval('public.votes_vote_id_seq'::regclass);


--
-- Name: justifications justification_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.justifications ALTER COLUMN justification_id SET DEFAULT nextval('public.justifications_justification_id_seq'::regclass);


--
-- Name: media_excerpts media_excerpt_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_excerpts ALTER COLUMN media_excerpt_id SET DEFAULT nextval('public.media_excerpts_media_excerpt_id_seq'::regclass);


--
-- Name: password_reset_requests password_reset_request_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_requests ALTER COLUMN password_reset_request_id SET DEFAULT nextval('public.password_reset_requests_password_reset_request_id_seq'::regclass);


--
-- Name: permissions permission_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN permission_id SET DEFAULT nextval('public.permissions_permission_id_seq'::regclass);


--
-- Name: persorgs persorg_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persorgs ALTER COLUMN persorg_id SET DEFAULT nextval('public.persorgs_persorg_id_seq'::regclass);


--
-- Name: perspectives perspective_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perspectives ALTER COLUMN perspective_id SET DEFAULT nextval('public.perspectives_perspective_id_seq'::regclass);


--
-- Name: proposition_compounds proposition_compound_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposition_compounds ALTER COLUMN proposition_compound_id SET DEFAULT nextval('public.proposition_compounds_proposition_compound_id_seq'::regclass);


--
-- Name: proposition_tag_scores proposition_tag_score_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposition_tag_scores ALTER COLUMN proposition_tag_score_id SET DEFAULT nextval('public.proposition_tag_scores_proposition_tag_score_id_2_seq'::regclass);


--
-- Name: proposition_tag_votes proposition_tag_vote_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposition_tag_votes ALTER COLUMN proposition_tag_vote_id SET DEFAULT nextval('public.proposition_tag_votes_proposition_tag_vote_id'::regclass);


--
-- Name: propositions proposition_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propositions ALTER COLUMN proposition_id SET DEFAULT nextval('public.propositions_proposition_id_seq'::regclass);


--
-- Name: registration_requests registration_request_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registration_requests ALTER COLUMN registration_request_id SET DEFAULT nextval('public.registration_requests_registration_request_id_seq'::regclass);


--
-- Name: source_excerpt_paraphrases source_excerpt_paraphrase_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.source_excerpt_paraphrases ALTER COLUMN source_excerpt_paraphrase_id SET DEFAULT nextval('public.source_excerpt_paraphrases_source_excerpt_paraphrase_id_seq'::regclass);


--
-- Name: sources source_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sources ALTER COLUMN source_id SET DEFAULT nextval('public.sources_source_id_seq'::regclass);


--
-- Name: statements statement_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.statements ALTER COLUMN statement_id SET DEFAULT nextval('public.statements_statement_id_seq'::regclass);


--
-- Name: tags tag_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags ALTER COLUMN tag_id SET DEFAULT nextval('public.tags_tag_id_seq'::regclass);


--
-- Name: url_locators url_locator_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.url_locators ALTER COLUMN url_locator_id SET DEFAULT nextval('public.url_locators_url_locator_id_seq'::regclass);


--
-- Name: urls url_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.urls ALTER COLUMN url_id SET DEFAULT nextval('public.urls_url_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: writ_quote_url_target_anchors writ_quote_url_target_anchor_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.writ_quote_url_target_anchors ALTER COLUMN writ_quote_url_target_anchor_id SET DEFAULT nextval('public.writ_quote_url_target_anchors_writ_quote_url_target_anchor__seq'::regclass);


--
-- Name: writ_quote_url_targets writ_quote_url_target_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.writ_quote_url_targets ALTER COLUMN writ_quote_url_target_id SET DEFAULT nextval('public.writ_quote_url_targets_writ_quote_url_target_id_seq'::regclass);


--
-- Name: writ_quotes writ_quote_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.writ_quotes ALTER COLUMN writ_quote_id SET DEFAULT nextval('public.citation_references_citation_reference_id_seq'::regclass);


--
-- Name: writs writ_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.writs ALTER COLUMN writ_id SET DEFAULT nextval('public.citations_citation_id_seq'::regclass);


--
-- Name: media_excerpt_speakers media_excerpt_speakers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_excerpt_speakers
    ADD CONSTRAINT media_excerpt_speakers_pkey PRIMARY KEY (media_excerpt_id, speaker_persorg_id);


--
-- Name: media_excerpts media_excerpts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_excerpts
    ADD CONSTRAINT media_excerpts_pkey PRIMARY KEY (media_excerpt_id);


--
-- Name: password_reset_requests password_reset_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_requests
    ADD CONSTRAINT password_reset_requests_pkey PRIMARY KEY (password_reset_request_id);


--
-- Name: persorgs persorgs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persorgs
    ADD CONSTRAINT persorgs_pkey PRIMARY KEY (persorg_id);


--
-- Name: proposition_tag_scores proposition_tag_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposition_tag_scores
    ADD CONSTRAINT proposition_tag_scores_pkey PRIMARY KEY (proposition_tag_score_id);


--
-- Name: registration_requests registration_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registration_requests
    ADD CONSTRAINT registration_requests_pkey PRIMARY KEY (registration_request_id);


--
-- Name: sources sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sources
    ADD CONSTRAINT sources_pkey PRIMARY KEY (source_id);


--
-- Name: statements statements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.statements
    ADD CONSTRAINT statements_pkey PRIMARY KEY (statement_id);


--
-- Name: dom_anchors unique_anchor; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dom_anchors
    ADD CONSTRAINT unique_anchor UNIQUE (url_locator_id, exact_text, prefix_text, suffix_text, start_offset, end_offset);


--
-- Name: url_locators url_locators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.url_locators
    ADD CONSTRAINT url_locators_pkey PRIMARY KEY (url_locator_id);


--
-- Name: urls urls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.urls
    ADD CONSTRAINT urls_pkey PRIMARY KEY (url_id);


--
-- Name: writ_quote_url_target_anchors writ_quote_url_target_anchors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.writ_quote_url_target_anchors
    ADD CONSTRAINT writ_quote_url_target_anchors_pkey PRIMARY KEY (writ_quote_url_target_anchor_id);


--
-- Name: writ_quote_url_targets writ_quote_url_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.writ_quote_url_targets
    ADD CONSTRAINT writ_quote_url_targets_pkey PRIMARY KEY (writ_quote_url_target_id);


--
-- Name: idx_group_permissions_group_id_permission_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_group_permissions_group_id_permission_id ON public.group_permissions USING btree (group_id, permission_id) WHERE (deleted IS NULL);


--
-- Name: idx_justification_basis_compound_atoms_atom_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_justification_basis_compound_atoms_atom_id ON public.justification_basis_compound_atoms USING btree (justification_basis_compound_atom_id);


--
-- Name: idx_justification_basis_compounds_compounds_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_justification_basis_compounds_compounds_id ON public.justification_basis_compounds USING btree (justification_basis_compound_id);


--
-- Name: idx_justification_scores_justification_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_justification_scores_justification_id ON public.justification_scores USING btree (justification_id) WHERE (deleted IS NULL);


--
-- Name: idx_justifications_justification_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_justifications_justification_id ON public.justifications USING btree (justification_id);


--
-- Name: idx_permissions_permission_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_permissions_permission_name ON public.permissions USING btree (name) WHERE (deleted IS NULL);


--
-- Name: idx_persorgs_name_english; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_persorgs_name_english ON public.persorgs USING gin (to_tsvector('english'::regconfig, (name)::text));


--
-- Name: idx_persorgs_name_pattern; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_persorgs_name_pattern ON public.persorgs USING btree (name varchar_pattern_ops) WHERE (deleted IS NULL);


--
-- Name: idx_proposition_compounds_proposition_compound_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_proposition_compounds_proposition_compound_id ON public.proposition_compounds USING btree (proposition_compound_id);


--
-- Name: idx_propositions_proposition_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_propositions_proposition_id ON public.propositions USING btree (proposition_id);


--
-- Name: idx_registration_requests_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registration_requests_email ON public.registration_requests USING btree (email);


--
-- Name: idx_source_excerpt_paraphrases_source_excerpt_paraphrase_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_source_excerpt_paraphrases_source_excerpt_paraphrase_id ON public.source_excerpt_paraphrases USING btree (source_excerpt_paraphrase_id);


--
-- Name: idx_statement_compound_atoms_statement_compound_atom_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_statement_compound_atoms_statement_compound_atom_id ON public.proposition_compound_atoms USING btree (proposition_compound_id);


--
-- Name: idx_statement_tag_scores_statement_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_statement_tag_scores_statement_id ON public.proposition_tag_scores USING btree (score_type, proposition_id, tag_id) WHERE (deleted IS NULL);


--
-- Name: idx_statements_normal_text; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_statements_normal_text ON public.propositions USING btree (normal_text) WHERE (deleted IS NULL);


--
-- Name: idx_statements_speaker_sentence_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_statements_speaker_sentence_unique ON public.statements USING btree (speaker_persorg_id, sentence_type, sentence_id);


--
-- Name: idx_statements_text_pattern; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_statements_text_pattern ON public.propositions USING btree (text varchar_pattern_ops) WHERE (deleted IS NULL);


--
-- Name: idx_tags_normal_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_tags_normal_name ON public.tags USING btree (normal_name) WHERE (deleted IS NULL);


--
-- Name: idx_tags_normal_name_pattern; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tags_normal_name_pattern ON public.tags USING btree (normal_name varchar_pattern_ops) WHERE (deleted IS NULL);


--
-- Name: idx_tags_tag_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_tags_tag_id ON public.tags USING btree (tag_id);


--
-- Name: idx_urls_url_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_urls_url_id ON public.urls USING btree (url_id);


--
-- Name: idx_urls_url_pattern; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_urls_url_pattern ON public.urls USING btree (url varchar_pattern_ops) WHERE (deleted IS NULL);


--
-- Name: idx_user_auth_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_auth_user_id ON public.user_auth USING btree (user_id, hash_type);


--
-- Name: idx_user_external_ids_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_external_ids_user_id ON public.user_external_ids USING btree (user_id);


--
-- Name: idx_user_groups_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_groups_user_id ON public.user_groups USING btree (user_id) WHERE (deleted IS NULL);


--
-- Name: idx_user_permissions_user_id_permission_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_permissions_user_id_permission_id ON public.user_permissions USING btree (user_id, permission_id) WHERE (deleted IS NULL);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_users_email ON public.users USING btree (email) WHERE (deleted IS NULL);


--
-- Name: idx_users_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_users_user_id ON public.users USING btree (user_id);


--
-- Name: idx_writ_quote_urls_writ_quote_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_writ_quote_urls_writ_quote_id ON public.writ_quote_urls USING btree (writ_quote_id) WHERE (deleted IS NULL);


--
-- Name: idx_writ_quotes_normal_quote_text; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_writ_quotes_normal_quote_text ON public.writ_quotes USING btree (writ_id, normal_quote_text) WHERE (deleted IS NULL);


--
-- Name: idx_writ_quotes_quote_text_pattern; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_writ_quotes_quote_text_pattern ON public.writ_quotes USING btree (quote_text varchar_pattern_ops) WHERE (deleted IS NULL);


--
-- Name: idx_writ_quotes_writ_quote_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_writ_quotes_writ_quote_id ON public.writ_quotes USING btree (writ_quote_id);


--
-- Name: idx_writs_normal_title; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_writs_normal_title ON public.writs USING btree (normal_title) WHERE (deleted IS NULL);


--
-- Name: idx_writs_title_pattern; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_writs_title_pattern ON public.writs USING btree (title varchar_pattern_ops) WHERE (deleted IS NULL);


--
-- Name: idx_writs_writ_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_writs_writ_id ON public.writs USING btree (writ_id);


--
-- Name: media_excerpt_citations_unq_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX media_excerpt_citations_unq_idx ON public.media_excerpt_citations USING btree (media_excerpt_id, source_id, normal_pincite) WHERE (deleted IS NULL);


--
-- Name: media_excerpt_quotation_english_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_excerpt_quotation_english_idx ON public.media_excerpts USING gin (to_tsvector('english'::regconfig, (quotation)::text));


--
-- Name: persorg_organization_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX persorg_organization_unique_idx ON public.persorgs USING btree (normal_name) WHERE ((deleted IS NULL) AND (is_organization = true));


--
-- Name: persorg_person_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX persorg_person_unique_idx ON public.persorgs USING btree (normal_name, normal_known_for) WHERE ((deleted IS NULL) AND (is_organization = false));


--
-- Name: source_normal_description_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX source_normal_description_unique_idx ON public.sources USING btree (normal_description) WHERE (deleted IS NULL);


--
-- Name: sources_description_apa_english_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sources_description_apa_english_idx ON public.sources USING gin (to_tsvector('english'::regconfig, (description)::text));


--
-- Name: statement_text_fulltext_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX statement_text_fulltext_idx ON public.propositions USING gin (to_tsvector('english'::regconfig, (text)::text));


--
-- Name: test_unq_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX test_unq_idx ON public.test USING btree (the_value) WHERE (deleted IS NULL);


--
-- Name: unq_account_settings_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unq_account_settings_user ON public.account_settings USING btree (user_id);


--
-- Name: unq_password_reset_requests_password_reset_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX unq_password_reset_requests_password_reset_code ON public.password_reset_requests USING btree (password_reset_code);


--
-- Name: unq_registration_requests_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unq_registration_requests_code ON public.registration_requests USING btree (registration_code);


--
-- Name: unq_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unq_users_username ON public.users USING btree (username);


--
-- Name: urls_url_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX urls_url_unique_idx ON public.urls USING btree (url) WHERE (deleted IS NULL);


--
-- Name: writ_quotes_quote_text_english_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX writ_quotes_quote_text_english_idx ON public.writ_quotes USING gin (to_tsvector('english'::regconfig, (quote_text)::text));


--
-- Name: writ_title_fulltext_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX writ_title_fulltext_idx ON public.writs USING gin (to_tsvector('english'::regconfig, (title)::text));


--
-- Name: account_settings account_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_settings
    ADD CONSTRAINT account_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: content_reports content_reports_reporter_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_reports
    ADD CONSTRAINT content_reports_reporter_user_id_fkey FOREIGN KEY (reporter_user_id) REFERENCES public.users(user_id);


--
-- Name: dom_anchors dom_anchors_creator_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dom_anchors
    ADD CONSTRAINT dom_anchors_creator_user_id_fkey FOREIGN KEY (creator_user_id) REFERENCES public.users(user_id);


--
-- Name: dom_anchors dom_anchors_url_locator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dom_anchors
    ADD CONSTRAINT dom_anchors_url_locator_id_fkey FOREIGN KEY (url_locator_id) REFERENCES public.url_locators(url_locator_id);


--
-- Name: media_excerpt_citations media_excerpt_citations_creator_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_excerpt_citations
    ADD CONSTRAINT media_excerpt_citations_creator_user_id_fkey FOREIGN KEY (creator_user_id) REFERENCES public.users(user_id);


--
-- Name: media_excerpt_citations media_excerpt_citations_media_excerpt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_excerpt_citations
    ADD CONSTRAINT media_excerpt_citations_media_excerpt_id_fkey FOREIGN KEY (media_excerpt_id) REFERENCES public.media_excerpts(media_excerpt_id);


--
-- Name: media_excerpt_citations media_excerpt_citations_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_excerpt_citations
    ADD CONSTRAINT media_excerpt_citations_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: media_excerpt_speakers media_excerpt_speakers_creator_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_excerpt_speakers
    ADD CONSTRAINT media_excerpt_speakers_creator_user_id_fkey FOREIGN KEY (creator_user_id) REFERENCES public.users(user_id);


--
-- Name: media_excerpt_speakers media_excerpt_speakers_media_excerpt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_excerpt_speakers
    ADD CONSTRAINT media_excerpt_speakers_media_excerpt_id_fkey FOREIGN KEY (media_excerpt_id) REFERENCES public.media_excerpts(media_excerpt_id);


--
-- Name: media_excerpt_speakers media_excerpt_speakers_speaker_persorg_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_excerpt_speakers
    ADD CONSTRAINT media_excerpt_speakers_speaker_persorg_id_fkey FOREIGN KEY (speaker_persorg_id) REFERENCES public.persorgs(persorg_id);


--
-- Name: media_excerpts media_excerpts_creator_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_excerpts
    ADD CONSTRAINT media_excerpts_creator_user_id_fkey FOREIGN KEY (creator_user_id) REFERENCES public.users(user_id);


--
-- Name: password_reset_requests password_reset_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_requests
    ADD CONSTRAINT password_reset_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: persorgs persorgs_creator_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persorgs
    ADD CONSTRAINT persorgs_creator_user_id_fkey FOREIGN KEY (creator_user_id) REFERENCES public.users(user_id);


--
-- Name: sources sources_creator_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sources
    ADD CONSTRAINT sources_creator_user_id_fkey FOREIGN KEY (creator_user_id) REFERENCES public.users(user_id);


--
-- Name: statements statements_creator_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.statements
    ADD CONSTRAINT statements_creator_user_id_fkey FOREIGN KEY (creator_user_id) REFERENCES public.users(user_id);


--
-- Name: statements statements_root_proposition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.statements
    ADD CONSTRAINT statements_root_proposition_id_fkey FOREIGN KEY (root_proposition_id) REFERENCES public.propositions(proposition_id);


--
-- Name: statements statements_speaker_persorg_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.statements
    ADD CONSTRAINT statements_speaker_persorg_id_fkey FOREIGN KEY (speaker_persorg_id) REFERENCES public.persorgs(persorg_id);


--
-- Name: url_locators url_locators_creator_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.url_locators
    ADD CONSTRAINT url_locators_creator_user_id_fkey FOREIGN KEY (creator_user_id) REFERENCES public.users(user_id);


--
-- Name: url_locators url_locators_url_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.url_locators
    ADD CONSTRAINT url_locators_url_id_fkey FOREIGN KEY (url_id) REFERENCES public.urls(url_id);


--
-- Name: writ_quote_url_target_anchors writ_quote_url_target_anchors_writ_quote_url_target_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.writ_quote_url_target_anchors
    ADD CONSTRAINT writ_quote_url_target_anchors_writ_quote_url_target_id_fkey FOREIGN KEY (writ_quote_url_target_id) REFERENCES public.writ_quote_url_targets(writ_quote_url_target_id);


--
-- Name: writ_quote_url_targets writ_quote_url_targets_url_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.writ_quote_url_targets
    ADD CONSTRAINT writ_quote_url_targets_url_id_fkey FOREIGN KEY (url_id) REFERENCES public.urls(url_id);


--
-- Name: writ_quote_url_targets writ_quote_url_targets_writ_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.writ_quote_url_targets
    ADD CONSTRAINT writ_quote_url_targets_writ_quote_id_fkey FOREIGN KEY (writ_quote_id) REFERENCES public.writ_quotes(writ_quote_id);


--
-- PostgreSQL database dump complete
--

